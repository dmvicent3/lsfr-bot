import { Database } from "bun:sqlite";
import { beforeEach, describe, expect, test } from "bun:test";
import { runMigrations } from "../../../src/core/db.ts";
import { FeedError } from "../../../src/modules/rss/feeds/parse.ts";
import { rssMigrations } from "../../../src/modules/rss/store/migrations.ts";
import { RssRepo } from "../../../src/modules/rss/store/repo.ts";
import {
  addRule,
  followFeed,
  MAX_FEEDS,
  MAX_RULES,
  RuleError,
} from "../../../src/modules/rss/subscriptions.ts";

const bodies = new Map<string, string>();

const fetchFeed = async (url: string): Promise<string> => {
  const body = bodies.get(url);

  if (body === undefined) throw new FeedError("HTTP 404");

  return body;
};

const follow = (guildId: string, url: string, name: string | null = null) =>
  followFeed(repo, { guildId, url, name }, { fetchFeed, now: 1 });
const failure = (p: Promise<unknown>) => p.catch((e: unknown) => e);

let repo: RssRepo;

beforeEach(() => {
  const db = new Database(":memory:", { strict: true });
  runMigrations(db, rssMigrations);
  repo = new RssRepo(db);
  bodies.clear();
  bodies.set("https://a/rss", "<rss><channel><title>Feed</title></channel></rss>");
  bodies.set("https://html", "<html></html>");
});

describe("followFeed", () => {
  test("names a feed after its title unless given a name", async () => {
    expect((await follow("g1", "https://a/rss")).name).toBe("Feed");
    expect((await follow("g2", "https://a/rss", "Mine")).name).toBe("Mine");
  });

  test("refuses a non-feed and a feed already followed", async () => {
    expect(await failure(follow("g1", "https://html"))).toBeInstanceOf(FeedError);
    await follow("g1", "https://a/rss");
    expect(await failure(follow("g1", "https://a/rss"))).toBeInstanceOf(FeedError);
  });

  test(`caps feeds at ${MAX_FEEDS} and caps a feed title used as its name`, async () => {
    for (let n = 0; n < MAX_FEEDS; n++) repo.feeds.add("g1", `https://f/${n}`, "x");

    expect(await failure(follow("g1", "https://a/rss"))).toBeInstanceOf(FeedError);
    bodies.set("https://long", `<rss><channel><title>${"t".repeat(500)}</title></channel></rss>`);
    expect((await follow("g2", "https://long")).name).toHaveLength(100);
  });
});

describe("addRule", () => {
  test(`caps rules at ${MAX_RULES} and refuses a blank rule`, () => {
    for (let n = 0; n < MAX_RULES; n++) addRule(repo, "g1", `topic ${n}`, n % 2 ? "only" : "block");

    expect(() => addRule(repo, "g1", "one more", "only")).toThrow(RuleError);
    expect(() => addRule(repo, "g2", "   ", "block")).toThrow(RuleError);
    expect(addRule(repo, "g2", " Europe ", "only")).toMatchObject({ text: "Europe", kind: "only" });
  });
});
