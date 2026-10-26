import { Database } from "bun:sqlite";
import { beforeEach, describe, expect, test } from "bun:test";
import type { APIEmbed } from "discord.js";
import { runMigrations } from "../../../../src/core/db.ts";
import { EmbedError } from "../../../../src/core/embed/http.ts";
import type { Embedder } from "../../../../src/core/embed/types.ts";
import { JevError } from "../../../../src/core/jev/http.ts";
import type { Jev } from "../../../../src/core/jev/types.ts";
import { MAX_CLASSIFY } from "../../../../src/modules/rss/cycle/classify.ts";
import { runCycle } from "../../../../src/modules/rss/cycle/cycle.ts";
import type { CycleDeps, PostResult } from "../../../../src/modules/rss/cycle/types.ts";
import { followFeed } from "../../../../src/modules/rss/subscriptions.ts";
import { FeedError } from "../../../../src/modules/rss/feeds/parse.ts";
import { rssMigrations } from "../../../../src/modules/rss/store/migrations.ts";
import { RssRepo } from "../../../../src/modules/rss/store/repo.ts";

const HOUR = 3_600_000;
const SERVER = { guildId: "g1", channelId: "c1" };

function rss(...titles: string[]): string {
  const items = titles
    .map((t) => `<item><title>${t}</title><link>https://n.example/${t}</link></item>`)
    .join("");

  return `<rss><channel><title>Feed</title>${items}</channel></rss>`;
}

let repo: RssRepo;
let feeds: Map<string, string | Error>;
let jevMode: "ok" | "fail";
let pYes: (state: string) => number;
let jevCalls: number;
let posted: string[];
let said: string[];
let postResult: PostResult;
let now: number;
/** Story vectors by title; a title without one gets [1, 0]. */
let vectors: Map<string, Float32Array>;
let embedMode: "ok" | "fail" | "off";
let embedCalls: number;

const jev: Jev = {
  async yesNo(state, questions) {
    jevCalls++;

    if (jevMode === "fail") throw new JevError("down");

    return new Map(questions.map((q) => [q.key, pYes(state)]));
  },
};

const embedder: Embedder = {
  async embed(text) {
    embedCalls++;

    if (embedMode === "fail") throw new EmbedError("down");

    return vectors.get(text.slice(text.indexOf("query: ") + 7)) ?? Float32Array.of(1, 0);
  },
};

function deps(): CycleDeps {
  return {
    repo,
    jev,
    fetchFeed: async (url) => {
      const body = feeds.get(url);

      if (body instanceof Error) throw body;

      if (body === undefined) throw new FeedError("HTTP 404");

      return body;
    },
    post: async (_channel, embed: APIEmbed) => {
      if (postResult === "ok") posted.push(embed.title ?? "");

      return postResult;
    },
    say: async (_channel, text) => {
      said.push(text);
    },
    now: () => now,
    embedder: embedMode === "off" ? null : embedder,
  };
}

const cycle = () => runCycle({ ...SERVER, jevDown: repo.servers.jevDown(SERVER.guildId) }, deps());

beforeEach(() => {
  const db = new Database(":memory:", { strict: true });
  runMigrations(db, rssMigrations);
  repo = new RssRepo(db);
  repo.servers.setChannel("g1", "c1");
  feeds = new Map();
  jevMode = "ok";
  pYes = () => 0;
  jevCalls = 0;
  posted = [];
  said = [];
  postResult = "ok";
  now = 1_000 * HOUR;
  vectors = new Map();
  embedMode = "off";
  embedCalls = 0;
});

describe("runCycle", () => {
  test("posts new items once, without jev when there are no rules", async () => {
    repo.feeds.add("g1", "https://a/rss", "A");
    feeds.set("https://a/rss", rss("one", "two"));
    await cycle();
    expect(posted).toEqual(["one", "two"]);
    expect(jevCalls).toBe(0);
    await cycle();
    expect(posted).toEqual(["one", "two"]);
  });

  test("stores the same article from two feeds once and skips keyless items", async () => {
    repo.feeds.add("g1", "https://a/rss", "A");
    repo.feeds.add("g1", "https://b/rss", "B");
    feeds.set("https://a/rss", rss("same"));
    feeds.set(
      "https://b/rss",
      `<rss><channel><title>B</title><item><title>same</title><link>https://n.example/same</link></item><item><title>keyless</title></item></channel></rss>`,
    );
    await cycle();
    expect(posted).toEqual(["same"]);
  });

  test("blocks an article any rule matches and posts the rest", async () => {
    repo.feeds.add("g1", "https://a/rss", "A");
    repo.rules.add("g1", "sports", "block");
    feeds.set("https://a/rss", rss("football", "chips"));
    pYes = (state) => (state.startsWith("football") ? 0.9 : 0.1);
    await cycle();
    expect(posted).toEqual(["chips"]);
    expect(repo.items.inState("g1", "blocked", 10).map((i) => i.title)).toEqual(["football"]);
  });

  test("an only-rule limited to one feed filters that feed and leaves the others alone", async () => {
    const news = repo.feeds.add("g1", "https://news/rss", "News");
    repo.feeds.add("g1", "https://space/rss", "Space");
    const europe = repo.rules.add("g1", "Europe", "only");
    repo.rules.setFeeds("g1", europe.id, [news.id]);
    feeds.set("https://news/rss", rss("paris", "texas"));
    feeds.set("https://space/rss", rss("rocket"));
    pYes = (state) => (state.startsWith("paris") ? 0.9 : 0.1);
    await cycle();
    expect(posted).toEqual(["paris", "rocket"]);
    expect(repo.items.inState("g1", "blocked", 10).map((i) => i.title)).toEqual(["texas"]);
    expect(jevCalls).toBe(2);
  });

  test("holds articles while jev is down, says so once, and says when it is back", async () => {
    repo.feeds.add("g1", "https://a/rss", "A");
    repo.rules.add("g1", "sports", "block");
    feeds.set("https://a/rss", rss("one"));
    jevMode = "fail";
    await cycle();
    feeds.set("https://a/rss", rss("one", "two"));
    await cycle();
    expect(posted).toEqual([]);
    expect(said).toEqual(["⚠️ jev is down, new articles will be checked once it's back."]);
    expect(repo.items.inState("g1", "pending", 10)).toHaveLength(2);
    jevMode = "ok";
    await cycle();
    expect(said.at(-1)).toBe("✅ jev is back.");
    expect(posted).toEqual(["one", "two"]);
    await cycle();
    expect(said).toHaveLength(2);
  });

  test("expires an article still waiting after 24 hours", async () => {
    repo.feeds.add("g1", "https://a/rss", "A");
    repo.rules.add("g1", "sports", "block");
    feeds.set("https://a/rss", rss("old"));
    jevMode = "fail";
    await cycle();
    now += 25 * HOUR;
    jevMode = "ok";
    await cycle();
    expect(posted).toEqual([]);
    expect(repo.items.inState("g1", "expired", 10).map((i) => i.title)).toEqual(["old"]);
  });

  test(`classifies at most ${MAX_CLASSIFY} articles a cycle`, async () => {
    repo.feeds.add("g1", "https://a/rss", "A");
    repo.rules.add("g1", "sports", "block");
    feeds.set("https://a/rss", rss(...Array.from({ length: 40 }, (_, n) => `n${n}`)));
    await cycle();
    expect(jevCalls).toBe(MAX_CLASSIFY);
    expect(repo.items.inState("g1", "pending", 50)).toHaveLength(10);
  });

  test("warns once about a feed failing 10 times in a row, and still reads the others", async () => {
    repo.feeds.add("g1", "https://bad/rss", "Bad");
    repo.feeds.add("g1", "https://a/rss", "A");
    feeds.set("https://bad/rss", new FeedError("HTTP 500"));
    feeds.set("https://a/rss", rss("one"));

    for (let n = 0; n < 11; n++) await cycle();

    expect(said).toEqual(["⚠️ Feed **Bad** keeps failing: HTTP 500"]);
    expect(posted).toEqual(["one"]);
  });

  test("a feed that is not a feed counts as a failure", async () => {
    const bad = repo.feeds.add("g1", "https://html/rss", "Html");
    feeds.set("https://html/rss", "<html></html>");
    await cycle();
    expect(repo.feeds.list("g1").find((f) => f.id === bad.id)?.failures).toBe(1);
  });

  test("a lost channel clears it and stops; a failed post retries next cycle", async () => {
    repo.feeds.add("g1", "https://a/rss", "A");
    feeds.set("https://a/rss", rss("one"));
    postResult = "failed";
    await cycle();
    expect(repo.items.inState("g1", "passed", 10)).toHaveLength(1);
    postResult = "lost-channel";
    await cycle();
    expect(repo.servers.channel("g1")).toBeNull();
    postResult = "ok";
    repo.servers.setChannel("g1", "c1");
    await cycle();
    expect(posted).toEqual(["one"]);
  });
});

describe("after followFeed", () => {
  test("only items published after following are posted", async () => {
    feeds.set("https://a/rss", rss("old1", "old2"));
    const request = { guildId: "g1", url: "https://a/rss", name: null };
    await followFeed(repo, request, { fetchFeed: deps().fetchFeed, now });
    await cycle();
    expect(posted).toEqual([]);
    feeds.set("https://a/rss", rss("new", "old1", "old2"));
    await cycle();
    expect(posted).toEqual(["new"]);
  });
});

describe("runCycle staleness", () => {
  test("does not post an article dated more than 24 hours ago", async () => {
    repo.feeds.add("g1", "https://a/rss", "A");
    const old = new Date(now - 48 * HOUR).toUTCString();
    const fresh = new Date(now - HOUR).toUTCString();
    feeds.set(
      "https://a/rss",
      `<rss><channel><title>F</title><item><title>old</title><link>https://n.example/old</link><pubDate>${old}</pubDate></item><item><title>fresh</title><link>https://n.example/fresh</link><pubDate>${fresh}</pubDate></item></channel></rss>`,
    );
    await cycle();
    expect(posted).toEqual(["fresh"]);
  });
});

describe("runCycle repeat check", () => {
  const X = Float32Array.of(1, 0);
  const Y = Float32Array.of(0, 1);

  beforeEach(() => {
    embedMode = "ok";
    repo.feeds.add("g1", "https://a/rss", "A");
  });

  test("drops a story already posted", async () => {
    vectors.set("vucic-concedes", X).set("vucic-defeat", X);
    feeds.set("https://a/rss", rss("vucic-concedes"));
    await cycle();
    feeds.set("https://a/rss", rss("vucic-concedes", "vucic-defeat"));
    await cycle();
    expect(posted).toEqual(["vucic-concedes"]);
    expect(repo.items.inState("g1", "duplicate", 10).map((i) => i.title)).toEqual(["vucic-defeat"]);
  });

  test("posts a new story and stores its vector", async () => {
    vectors.set("serbia", X).set("brazil", Y);
    feeds.set("https://a/rss", rss("serbia", "brazil"));
    await cycle();
    expect(posted).toEqual(["serbia", "brazil"]);
    expect(repo.items.recentEmbeddings("g1", 0)).toHaveLength(2);
  });

  test("two repeats in one batch post once", async () => {
    vectors.set("one", X).set("two", X);
    feeds.set("https://a/rss", rss("one", "two"));
    await cycle();
    expect(posted).toEqual(["one"]);
  });

  test("compares only the last 24 hours", async () => {
    vectors.set("old", X).set("again", X);
    feeds.set("https://a/rss", rss("old"));
    await cycle();
    now += 25 * HOUR;
    feeds.set("https://a/rss", rss("again"));
    await cycle();
    expect(posted).toEqual(["old", "again"]);
  });

  test("posts without a vector when embed fails", async () => {
    embedMode = "fail";
    feeds.set("https://a/rss", rss("a", "b", "c"));
    await cycle();
    expect(posted).toEqual(["a", "b", "c"]);
    expect(repo.items.recentEmbeddings("g1", 0)).toEqual([]);
  });

  test("stops calling embed for the rest of the pass after it fails", async () => {
    embedMode = "fail";
    feeds.set("https://a/rss", rss("a", "b", "c"));
    await cycle();
    expect(embedCalls).toBe(1);
  });

  test("a failed post stores no vector and is posted later", async () => {
    vectors.set("story", X);
    feeds.set("https://a/rss", rss("story"));
    postResult = "failed";
    await cycle();
    expect(repo.items.recentEmbeddings("g1", 0)).toEqual([]);
    expect(repo.items.inState("g1", "passed", 10).map((i) => i.title)).toEqual(["story"]);
    postResult = "ok";
    await cycle();
    expect(posted).toEqual(["story"]);
  });

  test("blank titles skip the check", async () => {
    feeds.set(
      "https://a/rss",
      `<rss><channel><title>A</title><item><title> </title><link>https://n.example/1</link></item><item><title> </title><link>https://n.example/2</link></item></channel></rss>`,
    );
    await cycle();
    expect(posted).toHaveLength(2);
    expect(embedCalls).toBe(0);
  });
});
