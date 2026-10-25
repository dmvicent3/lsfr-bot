import { Database } from "bun:sqlite";
import { beforeEach, describe, expect, test } from "bun:test";
import type { APIEmbed } from "discord.js";
import { runMigrations } from "../../core/db.ts";
import { JevError, type Jev } from "../../core/jev.ts";
import {
  addRule,
  type CycleDeps,
  followFeed,
  MAX_CLASSIFY,
  MAX_FEEDS,
  MAX_RULES,
  type PostResult,
  RuleError,
  runCycle,
} from "./cycle.ts";
import { FeedError } from "./parse.ts";
import { rssMigrations, RssRepo } from "./repo.ts";

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

const jev: Jev = {
  async yesNo(state, questions) {
    jevCalls++;
    if (jevMode === "fail") throw new JevError("down");
    return new Map(questions.map((q) => [q.key, pYes(state)]));
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
  };
}

const cycle = () => runCycle({ ...SERVER, jevDown: repo.jevDown(SERVER.guildId) }, deps());

beforeEach(() => {
  const db = new Database(":memory:", { strict: true });
  runMigrations(db, rssMigrations);
  repo = new RssRepo(db);
  repo.setChannel("g1", "c1");
  feeds = new Map();
  jevMode = "ok";
  pYes = () => 0;
  jevCalls = 0;
  posted = [];
  said = [];
  postResult = "ok";
  now = 1_000 * HOUR;
});

describe("runCycle", () => {
  test("posts new items once, without jev when there are no rules", async () => {
    repo.addFeed("g1", "https://a/rss", "A");
    feeds.set("https://a/rss", rss("one", "two"));
    await cycle();
    expect(posted).toEqual(["one", "two"]);
    expect(jevCalls).toBe(0);
    await cycle();
    expect(posted).toEqual(["one", "two"]);
  });

  test("stores the same article from two feeds once and skips keyless items", async () => {
    repo.addFeed("g1", "https://a/rss", "A");
    repo.addFeed("g1", "https://b/rss", "B");
    feeds.set("https://a/rss", rss("same"));
    feeds.set(
      "https://b/rss",
      `<rss><channel><title>B</title><item><title>same</title><link>https://n.example/same</link></item><item><title>keyless</title></item></channel></rss>`,
    );
    await cycle();
    expect(posted).toEqual(["same"]);
  });

  test("blocks an article any rule matches and posts the rest", async () => {
    repo.addFeed("g1", "https://a/rss", "A");
    repo.addRule("g1", "sports");
    feeds.set("https://a/rss", rss("football", "chips"));
    pYes = (state) => (state.startsWith("football") ? 0.9 : 0.1);
    await cycle();
    expect(posted).toEqual(["chips"]);
    expect(repo.itemsIn("g1", "blocked", 10).map((i) => i.title)).toEqual(["football"]);
  });

  test("holds articles while jev is down, says so once, and says when it is back", async () => {
    repo.addFeed("g1", "https://a/rss", "A");
    repo.addRule("g1", "sports");
    feeds.set("https://a/rss", rss("one"));
    jevMode = "fail";
    await cycle();
    feeds.set("https://a/rss", rss("one", "two"));
    await cycle();
    expect(posted).toEqual([]);
    expect(said).toEqual(["⚠️ jev is down, new articles will be checked once it's back."]);
    expect(repo.itemsIn("g1", "pending", 10)).toHaveLength(2);
    jevMode = "ok";
    await cycle();
    expect(said.at(-1)).toBe("✅ jev is back.");
    expect(posted).toEqual(["one", "two"]);
    await cycle();
    expect(said).toHaveLength(2);
  });

  test("expires an article still waiting after 24 hours", async () => {
    repo.addFeed("g1", "https://a/rss", "A");
    repo.addRule("g1", "sports");
    feeds.set("https://a/rss", rss("old"));
    jevMode = "fail";
    await cycle();
    now += 25 * HOUR;
    jevMode = "ok";
    await cycle();
    expect(posted).toEqual([]);
    expect(repo.itemsIn("g1", "expired", 10).map((i) => i.title)).toEqual(["old"]);
  });

  test(`classifies at most ${MAX_CLASSIFY} articles a cycle`, async () => {
    repo.addFeed("g1", "https://a/rss", "A");
    repo.addRule("g1", "sports");
    feeds.set("https://a/rss", rss(...Array.from({ length: 40 }, (_, n) => `n${n}`)));
    await cycle();
    expect(jevCalls).toBe(MAX_CLASSIFY);
    expect(repo.itemsIn("g1", "pending", 50)).toHaveLength(10);
  });

  test("warns once about a feed failing 10 times in a row, and still reads the others", async () => {
    repo.addFeed("g1", "https://bad/rss", "Bad");
    repo.addFeed("g1", "https://a/rss", "A");
    feeds.set("https://bad/rss", new FeedError("HTTP 500"));
    feeds.set("https://a/rss", rss("one"));
    for (let n = 0; n < 11; n++) await cycle();
    expect(said).toEqual(["⚠️ Feed **Bad** keeps failing: HTTP 500"]);
    expect(posted).toEqual(["one"]);
  });

  test("a feed that is not a feed counts as a failure", async () => {
    const bad = repo.addFeed("g1", "https://html/rss", "Html");
    feeds.set("https://html/rss", "<html></html>");
    await cycle();
    expect(repo.feeds("g1").find((f) => f.id === bad.id)?.failures).toBe(1);
  });

  test("a lost channel clears it and stops; a failed post retries next cycle", async () => {
    repo.addFeed("g1", "https://a/rss", "A");
    feeds.set("https://a/rss", rss("one"));
    postResult = "failed";
    await cycle();
    expect(repo.itemsIn("g1", "passed", 10)).toHaveLength(1);
    postResult = "lost-channel";
    await cycle();
    expect(repo.channel("g1")).toBeNull();
    postResult = "ok";
    repo.setChannel("g1", "c1");
    await cycle();
    expect(posted).toEqual(["one"]);
  });
});

describe("followFeed", () => {
  test("marks every current item as seen, so only later ones post", async () => {
    feeds.set("https://a/rss", rss("old1", "old2"));
    const feed = await followFeed(repo, "g1", "https://a/rss", null, deps().fetchFeed, now);
    expect(feed.name).toBe("Feed");
    await cycle();
    expect(posted).toEqual([]);
    feeds.set("https://a/rss", rss("new", "old1", "old2"));
    await cycle();
    expect(posted).toEqual(["new"]);
  });

  test("keeps a given name, refuses a non-feed and a feed already followed", async () => {
    feeds.set("https://a/rss", rss("x"));
    feeds.set("https://html", "<html></html>");
    expect(
      (await followFeed(repo, "g1", "https://a/rss", "Mine", deps().fetchFeed, now)).name,
    ).toBe("Mine");
    const notFeed = await followFeed(repo, "g1", "https://html", null, deps().fetchFeed, now).catch(
      (e: unknown) => e,
    );
    expect(notFeed).toBeInstanceOf(FeedError);
    const again = await followFeed(repo, "g1", "https://a/rss", null, deps().fetchFeed, now).catch(
      (e: unknown) => e,
    );
    expect(again).toBeInstanceOf(FeedError);
  });
});

describe("runCycle staleness", () => {
  test("does not post an article dated more than 24 hours ago", async () => {
    repo.addFeed("g1", "https://a/rss", "A");
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

describe("addRule and follow limits", () => {
  test(`caps rules at ${MAX_RULES} and refuses a blank rule`, () => {
    for (let n = 0; n < MAX_RULES; n++) addRule(repo, "g1", `topic ${n}`);
    expect(() => addRule(repo, "g1", "one more")).toThrow(RuleError);
    expect(() => addRule(repo, "g2", "   ")).toThrow(RuleError);
    expect(addRule(repo, "g2", " sports ").text).toBe("sports");
  });

  test(`caps feeds at ${MAX_FEEDS} and caps a feed title used as its name`, async () => {
    for (let n = 0; n < MAX_FEEDS; n++) repo.addFeed("g1", `https://f/${n}`, "x");
    feeds.set("https://a/rss", `<rss><channel><title>${"t".repeat(500)}</title></channel></rss>`);
    const full = await followFeed(repo, "g1", "https://a/rss", null, deps().fetchFeed, now).catch(
      (e: unknown) => e,
    );
    expect(full).toBeInstanceOf(FeedError);
    expect(
      (await followFeed(repo, "g2", "https://a/rss", null, deps().fetchFeed, now)).name,
    ).toHaveLength(100);
  });
});
