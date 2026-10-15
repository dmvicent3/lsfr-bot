import { Database } from "bun:sqlite";
import { beforeEach, expect, test } from "bun:test";
import { runMigrations } from "../../core/db.ts";
import type { FetchFn } from "../../core/guards.ts";
import { coreMigrations } from "../../core/settings.ts";
import { collectResults } from "./collect-results.ts";
import { motorsportMigrations, MotorsportRepo } from "./repo.ts";
import { fixture } from "./sources/testing.ts";
import type { SeriesKey, Session } from "./types.ts";

const RACE_START = Date.parse("2026-10-11T12:00:00Z");
const AFTER_RACE = RACE_START + 3 * 3_600_000;
let repo: MotorsportRepo;
let posts: { series: SeriesKey; text: string }[];

const race: Session = {
  series: "f1",
  eventId: "2026-singapore-grand-prix",
  eventName: "Singapore Grand Prix",
  sessionId: "race",
  title: "Race",
  start: new Date(RACE_START),
  end: new Date(RACE_START + 2 * 3_600_000),
  pingable: true,
};

async function openf1(published: boolean): Promise<FetchFn> {
  const sessions = JSON.stringify(await fixture("openf1-sessions"));
  const drivers = JSON.stringify(await fixture("openf1-drivers"));
  const result = JSON.stringify(await fixture("openf1-result-race"));
  return async (url) => {
    if (url.includes("/sessions?")) return new Response(sessions);
    if (url.includes("/drivers?")) return new Response(drivers);
    if (url.includes("/session_result?") && published) return new Response(result);
    return new Response("{}", { status: 404 });
  };
}

const post = async (series: SeriesKey, text: string): Promise<void> => {
  posts.push({ series, text });
};

beforeEach(() => {
  const db = new Database(":memory:", { strict: true });
  runMigrations(db, [...coreMigrations, ...motorsportMigrations]);
  repo = new MotorsportRepo(db);
  repo.replaceSessions("f1", [race], 0);
  posts = [];
});

test("posts a published result once and stores it", async () => {
  const fetchFn = await openf1(true);
  await collectResults(repo, AFTER_RACE, fetchFn, post);
  await collectResults(repo, AFTER_RACE + 300_000, fetchFn, post);
  expect(posts).toHaveLength(1);
  expect(posts[0]?.text).toStartWith("## 🏁 F1 — Singapore Grand Prix · Race results\n||`P1 ");
  expect(repo.latestResult("f1")?.rows[0]?.name).toBe("Verstappen");
});

test("nothing published yet: nothing posted or stored", async () => {
  await collectResults(repo, AFTER_RACE, await openf1(false), post);
  expect(posts).toEqual([]);
  expect(repo.latestResult("f1")).toBeNull();
});

test("a failed post is retried on the next run", async () => {
  const fetchFn = await openf1(true);
  await collectResults(repo, AFTER_RACE, fetchFn, async () => {
    throw new Error("discord down");
  });
  expect(repo.latestResult("f1")).toBeNull();
  await collectResults(repo, AFTER_RACE, fetchFn, post);
  expect(posts).toHaveLength(1);
});
