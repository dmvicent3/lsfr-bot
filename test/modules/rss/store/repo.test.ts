import { Database } from "bun:sqlite";
import { beforeEach, describe, expect, test } from "bun:test";
import { runMigrations } from "../../../../src/core/db.ts";
import type { FeedItem } from "../../../../src/modules/rss/feeds/types.ts";
import { rssMigrations } from "../../../../src/modules/rss/store/migrations.ts";
import { RssRepo } from "../../../../src/modules/rss/store/repo.ts";

let repo: RssRepo;

beforeEach(() => {
  const db = new Database(":memory:", { strict: true });
  runMigrations(db, rssMigrations);
  repo = new RssRepo(db);
});

const item = (title: string): FeedItem => ({
  title,
  link: `https://x.example/${title}`,
  guid: null,
  description: "d",
  publishedAt: 5,
  image: null,
});

describe("servers", () => {
  test("lists servers with a channel, with their jev-down flag", () => {
    repo.servers.setChannel("g1", "c1");
    repo.servers.setChannel("g2", "c2");
    repo.servers.setChannel("g2", null);
    repo.servers.setJevDown("g1", true);
    expect(repo.servers.list()).toEqual([{ guildId: "g1", channelId: "c1", jevDown: true }]);
    expect(repo.servers.jevDown("g1")).toBe(true);
    expect(repo.servers.jevDown("g9")).toBe(false);
    repo.servers.setJevDown("g1", false);
    expect(repo.servers.jevDown("g1")).toBe(false);
  });

  test("tells a server's channel", () => {
    expect(repo.servers.channel("g1")).toBeNull();
    repo.servers.setChannel("g1", "c1");
    expect(repo.servers.channel("g1")).toBe("c1");
  });
});

describe("feeds", () => {
  test("adds, lists, records results and removes, per server", () => {
    const f = repo.feeds.add("g1", "https://a.example/rss", "A");
    repo.feeds.add("g2", "https://a.example/rss", "A elsewhere");
    expect(repo.feeds.list("g1")).toEqual([
      {
        id: f.id,
        guildId: "g1",
        url: "https://a.example/rss",
        name: "A",
        failures: 0,
        warned: false,
      },
    ]);
    repo.feeds.recordResult(f.id, 10, true);
    expect(repo.feeds.list("g1")[0]).toMatchObject({ failures: 10, warned: true });
    expect(repo.unfollow("g2", f.id)).toBe(false);
    expect(repo.unfollow("g1", f.id)).toBe(true);
    expect(repo.feeds.list("g1")).toEqual([]);
    expect(repo.feeds.list("g2")).toHaveLength(1);
  });

  test("refuses the same URL twice in one server", () => {
    repo.feeds.add("g1", "https://a.example/rss", "A");
    expect(() => repo.feeds.add("g1", "https://a.example/rss", "B")).toThrow();
  });

  test("removing a feed drops its waiting items but keeps the rest for dedupe", () => {
    const f = repo.feeds.add("g1", "https://a.example/rss", "A");
    repo.items.insert({
      guildId: "g1",
      feedId: f.id,
      key: "k1",
      item: item("a"),
      state: "pending",
      now: 1,
    });
    repo.items.insert({
      guildId: "g1",
      feedId: f.id,
      key: "k2",
      item: item("b"),
      state: "passed",
      now: 1,
    });
    repo.items.insert({
      guildId: "g1",
      feedId: f.id,
      key: "k3",
      item: item("c"),
      state: "posted",
      now: 1,
    });
    repo.unfollow("g1", f.id);
    expect(repo.items.inState("g1", "pending", 10)).toEqual([]);
    expect(repo.items.inState("g1", "passed", 10)).toEqual([]);
    expect(
      repo.items.insert({
        guildId: "g1",
        feedId: 99,
        key: "k3",
        item: item("c"),
        state: "pending",
        now: 2,
      }),
    ).toBe(false);
  });
});

describe("rules", () => {
  test("adds, lists and removes, per server", () => {
    const r = repo.rules.add("g1", "sports", "block");
    repo.rules.add("g2", "religion", "block");
    expect(repo.rules.list("g1")).toEqual([
      { id: r.id, text: "sports", kind: "block", feedIds: [] },
    ]);
    expect(repo.rules.remove("g2", r.id)).toBe(false);
    expect(repo.rules.remove("g1", r.id)).toBe(true);
    expect(repo.rules.list("g1")).toEqual([]);
  });

  test("limits a rule to some of the server's feeds", () => {
    const a = repo.feeds.add("g1", "https://a/rss", "A");
    const b = repo.feeds.add("g1", "https://b/rss", "B");
    const theirs = repo.feeds.add("g2", "https://c/rss", "C");
    const r = repo.rules.add("g1", "Europe", "only");
    expect(repo.rules.setFeeds("g1", r.id, [b.id, a.id, theirs.id])).toBe(true);
    expect(repo.rules.get("g1", r.id)).toEqual({
      id: r.id,
      text: "Europe",
      kind: "only",
      feedIds: [a.id, b.id],
    });
    expect(repo.rules.setFeeds("g1", r.id, [])).toBe(true);
    expect(repo.rules.get("g1", r.id)?.feedIds).toEqual([]);
    expect(repo.rules.setFeeds("g2", r.id, [theirs.id])).toBe(false);
    expect(repo.rules.get("g2", r.id)).toBeNull();
  });

  test("unfollowing a feed removes a rule left with no feeds, never widening it to all", () => {
    const a = repo.feeds.add("g1", "https://a/rss", "A");
    const b = repo.feeds.add("g1", "https://b/rss", "B");
    const onlyA = repo.rules.add("g1", "x", "only");
    const aAndB = repo.rules.add("g1", "y", "only");
    const everywhere = repo.rules.add("g1", "z", "block");
    repo.rules.setFeeds("g1", onlyA.id, [a.id]);
    repo.rules.setFeeds("g1", aAndB.id, [a.id, b.id]);
    repo.unfollow("g1", a.id);
    expect(repo.rules.list("g1").map((r) => [r.id, r.feedIds])).toEqual([
      [aAndB.id, [b.id]],
      [everywhere.id, []],
    ]);
  });
});

describe("rss-002 migration", () => {
  test("keeps existing rules as block rules for every feed", () => {
    const db = new Database(":memory:", { strict: true });
    runMigrations(db, rssMigrations.slice(0, 1));
    db.run("INSERT INTO rss_rules (guild_id, text) VALUES ('g1', 'sports')");
    runMigrations(db, rssMigrations);
    expect(new RssRepo(db).rules.list("g1")).toEqual([
      { id: 1, text: "sports", kind: "block", feedIds: [] },
    ]);
  });
});

describe("items", () => {
  test("stores an item once per server key", () => {
    expect(
      repo.items.insert({
        guildId: "g1",
        feedId: 1,
        key: "k",
        item: item("a"),
        state: "pending",
        now: 10,
      }),
    ).toBe(true);
    expect(
      repo.items.insert({
        guildId: "g1",
        feedId: 2,
        key: "k",
        item: item("a"),
        state: "pending",
        now: 11,
      }),
    ).toBe(false);
    expect(
      repo.items.insert({
        guildId: "g2",
        feedId: 3,
        key: "k",
        item: item("a"),
        state: "pending",
        now: 12,
      }),
    ).toBe(true);
  });

  test("lists items in a state, oldest first, up to a limit, and changes state", () => {
    repo.items.insert({
      guildId: "g1",
      feedId: 1,
      key: "k2",
      item: item("b"),
      state: "pending",
      now: 20,
    });
    repo.items.insert({
      guildId: "g1",
      feedId: 1,
      key: "k1",
      item: item("a"),
      state: "pending",
      now: 10,
    });
    repo.items.insert({
      guildId: "g1",
      feedId: 1,
      key: "k3",
      item: item("c"),
      state: "pending",
      now: 30,
    });
    const two = repo.items.inState("g1", "pending", 2);
    expect(two.map((i) => i.title)).toEqual(["a", "b"]);
    expect(two[0]).toMatchObject({
      feedId: 1,
      state: "pending",
      createdAt: 10,
      link: "https://x.example/a",
      description: "d",
      publishedAt: 5,
      image: null,
      guid: null,
    });
    repo.items.setState(two[0]!.id, "posted");
    expect(repo.items.inState("g1", "pending", 10).map((i) => i.title)).toEqual(["b", "c"]);
  });

  test("expires only waiting items older than the cut-off, in one server", () => {
    repo.items.insert({
      guildId: "g1",
      feedId: 1,
      key: "old-pending",
      item: item("a"),
      state: "pending",
      now: 10,
    });
    repo.items.insert({
      guildId: "g1",
      feedId: 1,
      key: "old-passed",
      item: item("b"),
      state: "passed",
      now: 10,
    });
    repo.items.insert({
      guildId: "g1",
      feedId: 1,
      key: "old-posted",
      item: item("c"),
      state: "posted",
      now: 10,
    });
    repo.items.insert({
      guildId: "g1",
      feedId: 1,
      key: "new",
      item: item("d"),
      state: "pending",
      now: 100,
    });
    repo.items.insert({
      guildId: "g2",
      feedId: 1,
      key: "other",
      item: item("e"),
      state: "pending",
      now: 10,
    });
    expect(repo.items.expire("g1", 50)).toBe(2);
    expect(repo.items.inState("g1", "expired", 10).map((i) => i.title)).toEqual(["a", "b"]);
    expect(repo.items.inState("g1", "pending", 10).map((i) => i.title)).toEqual(["d"]);
    expect(repo.items.inState("g2", "pending", 10)).toHaveLength(1);
  });
});

describe("item storage limits", () => {
  test("keeps at most 1,500 characters of a description", () => {
    repo.items.insert({
      guildId: "g1",
      feedId: 1,
      key: "k",
      item: { ...item("a"), description: "d".repeat(5000) },
      state: "pending",
      now: 1,
    });
    expect(repo.items.inState("g1", "pending", 1)[0]?.description).toHaveLength(1500);
  });

  test("prunes finished items older than the cut-off, keeping waiting ones", () => {
    repo.items.insert({
      guildId: "g1",
      feedId: 1,
      key: "posted",
      item: item("a"),
      state: "posted",
      now: 10,
    });
    repo.items.insert({
      guildId: "g1",
      feedId: 1,
      key: "blocked",
      item: item("b"),
      state: "blocked",
      now: 10,
    });
    repo.items.insert({
      guildId: "g1",
      feedId: 1,
      key: "pending",
      item: item("c"),
      state: "pending",
      now: 10,
    });
    repo.items.insert({
      guildId: "g1",
      feedId: 1,
      key: "recent",
      item: item("d"),
      state: "posted",
      now: 100,
    });
    expect(repo.items.prune("g1", 50)).toBe(2);
    expect(
      repo.items.insert({
        guildId: "g1",
        feedId: 1,
        key: "posted",
        item: item("a"),
        state: "posted",
        now: 200,
      }),
    ).toBe(true);
    expect(
      repo.items.insert({
        guildId: "g1",
        feedId: 1,
        key: "recent",
        item: item("d"),
        state: "posted",
        now: 200,
      }),
    ).toBe(false);
    expect(repo.items.inState("g1", "pending", 10)).toHaveLength(1);
  });
});

/** Inserts an item and returns its id. */
function add(guildId: string, key: string, state: "passed" | "posted", now: number): number {
  repo.items.insert({ guildId, feedId: 1, key, item: item(key), state, now });

  return repo.items.inState(guildId, state, 50).find((i) => i.title === key)?.id ?? -1;
}

describe("item embeddings", () => {
  test("setPosted stores the vector and recentEmbeddings reads it back", () => {
    const id = add("g1", "a", "passed", 10);
    repo.items.setPosted(id, Float32Array.of(0.6, 0.8));
    expect(repo.items.recentEmbeddings("g1", 0)).toEqual([Float32Array.of(0.6, 0.8)]);
    expect(repo.items.inState("g1", "posted", 10).map((i) => i.title)).toEqual(["a"]);
  });

  test("a vector stored from an offset view reads back whole", () => {
    const id = add("g1", "a", "passed", 10);
    const view = new Float32Array(Float32Array.of(9, 0.6, 0.8).buffer, 4, 2);
    repo.items.setPosted(id, view);
    expect(repo.items.recentEmbeddings("g1", 0)).toEqual([Float32Array.of(0.6, 0.8)]);
  });

  test("recentEmbeddings skips old, unposted, other-server and vectorless rows", () => {
    repo.items.setPosted(add("g1", "old", "passed", 5), Float32Array.of(1, 0));
    repo.items.setPosted(add("g1", "new", "passed", 20), Float32Array.of(0, 1));
    repo.items.setPosted(add("g2", "other", "passed", 20), Float32Array.of(1, 0));
    repo.items.setPosted(add("g1", "bare", "passed", 20), null);
    add("g1", "waiting", "passed", 20);
    expect(repo.items.recentEmbeddings("g1", 10)).toEqual([Float32Array.of(0, 1)]);
  });

  test("setPosted(id, null) posts without a vector", () => {
    repo.items.setPosted(add("g1", "a", "passed", 10), null);
    expect(repo.items.inState("g1", "posted", 10).map((i) => i.title)).toEqual(["a"]);
    expect(repo.items.recentEmbeddings("g1", 0)).toEqual([]);
  });

  test("prune deletes old duplicates", () => {
    const id = add("g1", "a", "passed", 10);
    repo.items.setState(id, "duplicate");
    expect(repo.items.prune("g1", 11)).toBe(1);
  });
});
