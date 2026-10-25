import { Database } from "bun:sqlite";
import { beforeEach, describe, expect, test } from "bun:test";
import { runMigrations } from "../../core/db.ts";
import type { FeedItem } from "./parse.ts";
import { rssMigrations, RssRepo } from "./repo.ts";

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
    repo.setChannel("g1", "c1");
    repo.setChannel("g2", "c2");
    repo.setChannel("g2", null);
    repo.setJevDown("g1", true);
    expect(repo.servers()).toEqual([{ guildId: "g1", channelId: "c1", jevDown: true }]);
    expect(repo.jevDown("g1")).toBe(true);
    expect(repo.jevDown("g9")).toBe(false);
    repo.setJevDown("g1", false);
    expect(repo.jevDown("g1")).toBe(false);
  });

  test("tells a server's channel", () => {
    expect(repo.channel("g1")).toBeNull();
    repo.setChannel("g1", "c1");
    expect(repo.channel("g1")).toBe("c1");
  });
});

describe("feeds", () => {
  test("adds, lists, records results and removes, per server", () => {
    const f = repo.addFeed("g1", "https://a.example/rss", "A");
    repo.addFeed("g2", "https://a.example/rss", "A elsewhere");
    expect(repo.feeds("g1")).toEqual([
      {
        id: f.id,
        guildId: "g1",
        url: "https://a.example/rss",
        name: "A",
        failures: 0,
        warned: false,
      },
    ]);
    repo.recordFeedResult(f.id, 10, true);
    expect(repo.feeds("g1")[0]).toMatchObject({ failures: 10, warned: true });
    expect(repo.removeFeed("g2", f.id)).toBe(false);
    expect(repo.removeFeed("g1", f.id)).toBe(true);
    expect(repo.feeds("g1")).toEqual([]);
    expect(repo.feeds("g2")).toHaveLength(1);
  });

  test("refuses the same URL twice in one server", () => {
    repo.addFeed("g1", "https://a.example/rss", "A");
    expect(() => repo.addFeed("g1", "https://a.example/rss", "B")).toThrow();
  });

  test("removing a feed drops its waiting items but keeps the rest for dedupe", () => {
    const f = repo.addFeed("g1", "https://a.example/rss", "A");
    repo.insertItem("g1", f.id, "k1", item("a"), "pending", 1);
    repo.insertItem("g1", f.id, "k2", item("b"), "passed", 1);
    repo.insertItem("g1", f.id, "k3", item("c"), "posted", 1);
    repo.removeFeed("g1", f.id);
    expect(repo.itemsIn("g1", "pending", 10)).toEqual([]);
    expect(repo.itemsIn("g1", "passed", 10)).toEqual([]);
    expect(repo.insertItem("g1", 99, "k3", item("c"), "pending", 2)).toBe(false);
  });
});

describe("rules", () => {
  test("adds, lists and removes, per server", () => {
    const r = repo.addRule("g1", "sports");
    repo.addRule("g2", "religion");
    expect(repo.rules("g1")).toEqual([{ id: r.id, text: "sports" }]);
    expect(repo.removeRule("g2", r.id)).toBe(false);
    expect(repo.removeRule("g1", r.id)).toBe(true);
    expect(repo.rules("g1")).toEqual([]);
  });
});

describe("items", () => {
  test("stores an item once per server key", () => {
    expect(repo.insertItem("g1", 1, "k", item("a"), "pending", 10)).toBe(true);
    expect(repo.insertItem("g1", 2, "k", item("a"), "pending", 11)).toBe(false);
    expect(repo.insertItem("g2", 3, "k", item("a"), "pending", 12)).toBe(true);
  });

  test("lists items in a state, oldest first, up to a limit, and changes state", () => {
    repo.insertItem("g1", 1, "k2", item("b"), "pending", 20);
    repo.insertItem("g1", 1, "k1", item("a"), "pending", 10);
    repo.insertItem("g1", 1, "k3", item("c"), "pending", 30);
    const two = repo.itemsIn("g1", "pending", 2);
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
    repo.setState(two[0]!.id, "posted");
    expect(repo.itemsIn("g1", "pending", 10).map((i) => i.title)).toEqual(["b", "c"]);
  });

  test("expires only waiting items older than the cut-off, in one server", () => {
    repo.insertItem("g1", 1, "old-pending", item("a"), "pending", 10);
    repo.insertItem("g1", 1, "old-passed", item("b"), "passed", 10);
    repo.insertItem("g1", 1, "old-posted", item("c"), "posted", 10);
    repo.insertItem("g1", 1, "new", item("d"), "pending", 100);
    repo.insertItem("g2", 1, "other", item("e"), "pending", 10);
    expect(repo.expire("g1", 50)).toBe(2);
    expect(repo.itemsIn("g1", "expired", 10).map((i) => i.title)).toEqual(["a", "b"]);
    expect(repo.itemsIn("g1", "pending", 10).map((i) => i.title)).toEqual(["d"]);
    expect(repo.itemsIn("g2", "pending", 10)).toHaveLength(1);
  });
});
