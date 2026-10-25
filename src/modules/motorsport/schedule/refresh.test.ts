import { Database } from "bun:sqlite";
import { beforeEach, describe, expect, test } from "bun:test";
import { runMigrations } from "../../../core/db.ts";
import type { FetchFn } from "../../../core/types.ts";
import { coreMigrations } from "../../../core/settings.ts";
import { refreshAll } from "./refresh.ts";
import { motorsportMigrations, MotorsportRepo } from "../repo.ts";
import { SERIES } from "../series.ts";
import { sourceUrl } from "./sources/fetch.ts";
import { fixture } from "../testing/fixtures.ts";

const NOW = new Date("2026-10-15T12:00:00Z");
const FIXTURES: Record<string, string> = {
  f1: "tunous-formula1",
  wec: "tunous-wec",
  wrc: "tunous-wrc",
  indycar: "st-indycar",
  motogp: "st-motogp",
  fe: "st-fe",
  f2: "st-f2",
  f3: "st-f3",
};

/** Serves every 2026 fixture, 404 for anything else, with per-URL overrides. */
async function sourceFetch(overrides: Record<string, string> = {}): Promise<FetchFn> {
  const bodies = new Map<string, string>();
  for (const info of SERIES) {
    const name = FIXTURES[info.key] ?? "";
    bodies.set(sourceUrl(info, 2026), JSON.stringify(await fixture(name)));
  }
  for (const [url, body] of Object.entries(overrides)) bodies.set(url, body);
  return async (url) => {
    const body = bodies.get(url);
    return body === undefined ? new Response("", { status: 404 }) : new Response(body);
  };
}

const f1Info = SERIES.find((s) => s.key === "f1");
const wecInfo = SERIES.find((s) => s.key === "wec");
if (!f1Info || !wecInfo) throw new Error("series list changed");

let repo: MotorsportRepo;

beforeEach(() => {
  const db = new Database(":memory:", { strict: true });
  runMigrations(db, [...coreMigrations, ...motorsportMigrations]);
  repo = new MotorsportRepo(db);
});

describe("refreshAll", () => {
  test("loads every series; next year's 404 is not an error", async () => {
    const results = await refreshAll(repo, NOW, await sourceFetch());
    expect(results.every((r) => r.ok)).toBe(true);
    expect(results).toHaveLength(SERIES.length);
    expect(repo.listSessions("f1").length).toBeGreaterThan(0);
    expect(repo.listSessions("f1").some((s) => s.pingable)).toBe(true);
  });

  test("a broken source keeps the previous sessions", async () => {
    await refreshAll(repo, NOW, await sourceFetch());
    const before = repo.listSessions("wec").length;
    const results = await refreshAll(
      repo,
      NOW,
      await sourceFetch({ [sourceUrl(wecInfo, 2026)]: "not json" }),
    );
    expect(results.find((r) => r.series === "wec")?.ok).toBe(false);
    expect(results.find((r) => r.series === "f1")?.ok).toBe(true);
    expect(repo.listSessions("wec")).toHaveLength(before);
  });

  test("a 404 for this year keeps the previous sessions", async () => {
    await refreshAll(repo, NOW, await sourceFetch());
    const before = repo.listSessions("wec").length;
    const all = await sourceFetch();
    const wecGone: FetchFn = async (url, init) =>
      url === sourceUrl(wecInfo, 2026) ? new Response("", { status: 404 }) : all(url, init);
    const results = await refreshAll(repo, NOW, wecGone);
    expect(results.find((r) => r.series === "wec")?.ok).toBe(false);
    expect(repo.listSessions("wec")).toHaveLength(before);
  });

  test("includes next year's events when published", async () => {
    const nextYear = [
      {
        id: "bahrain-2027",
        title: "Bahrain Grand Prix",
        isCancelled: false,
        stages: [
          {
            id: "race",
            title: "Race",
            startDate: "2027-03-01T15:00:00Z",
            endDate: "2027-03-01T17:00:00Z",
            isSignificant: true,
          },
        ],
      },
    ];
    await refreshAll(
      repo,
      NOW,
      await sourceFetch({ [sourceUrl(f1Info, 2027)]: JSON.stringify(nextYear) }),
    );
    const sessions = repo.listSessions("f1");
    expect(sessions.some((s) => s.eventId === "2027-bahrain-2027" && s.pingable)).toBe(true);
    expect(sessions.some((s) => s.eventId === "2026-chinese-grand-prix")).toBe(true);
  });
});

test("the same event in two seasons keeps both", async () => {
  const f1Next = JSON.stringify(await fixture("tunous-formula1"));
  await refreshAll(repo, NOW, await sourceFetch({ [sourceUrl(f1Info, 2027)]: f1Next }));
  const both = repo.listSessions("f1").length;
  await refreshAll(repo, NOW, await sourceFetch());
  expect(both).toBe(repo.listSessions("f1").length * 2);
});
