import { Database } from "bun:sqlite";
import { beforeEach, describe, expect, test } from "bun:test";
import { runMigrations } from "../../../../src/core/db.ts";
import type { FetchFn } from "../../../../src/core/types.ts";
import { coreMigrations } from "../../../../src/core/settings.ts";
import {
  predictionGrid,
  predictPicker,
  savePick,
  seasonLeaderboard,
} from "../../../../src/modules/motorsport/predictions/predict-actions.ts";
import { MotorsportRepo } from "../../../../src/modules/motorsport/repo.ts";
import { motorsportMigrations } from "../../../../src/modules/motorsport/store/migrations.ts";
import type { Session } from "../../../../src/modules/motorsport/types.ts";

const T = Date.parse("2026-03-14T07:00:00Z");
let repo: MotorsportRepo;

function session(sessionId: string, title: string, start: number): Session {
  return {
    series: "f1",
    eventId: "e",
    eventName: "Chinese Grand Prix",
    sessionId,
    title,
    start: new Date(start),
    end: new Date(start + 3_600_000),
    pingable: true,
  };
}

beforeEach(() => {
  const db = new Database(":memory:", { strict: true });
  runMigrations(db, [...coreMigrations, ...motorsportMigrations]);
  repo = new MotorsportRepo(db);
  repo.sessions.replace(
    "f1",
    [
      session("qualifying", "Qualifying", T + 3_600_000),
      session("sprint-race", "Sprint", T - 3_600_000),
      session("race", "Race", T + 86_400_000),
    ],
    T,
  );
});

const noFetch: FetchFn = async () => {
  throw new Error("should not fetch");
};

const notFound: FetchFn = async () => new Response("{}", { status: 404 });

/** A stored qualifying result: the grid to pick from. */
function stored(): void {
  repo.results.insert({
    series: "f1",
    eventId: "e",
    eventName: "E",
    sessionId: "qualifying",
    kind: "qualifying",
    rows: [{ pos: "1", id: "3", name: "Verstappen", team: "", time: "" }],
    postedAt: 1,
  });
}

describe("savePick", () => {
  test("saves, swaps, and reports when the prediction becomes complete", () => {
    const pick = (index: number, id: string) =>
      savePick(
        repo,
        { userId: "u1", now: T },
        { series: "f1", eventId: "e", sessionId: "race" },
        { index: index, driverId: id },
      );
    expect(pick(0, "3")).toEqual({ ok: true, picks: ["3", null, null], completed: false });
    pick(1, "4");
    expect(pick(2, "16")).toEqual({ ok: true, picks: ["3", "4", "16"], completed: true });
    expect(pick(0, "16")).toEqual({ ok: true, picks: ["16", "4", "3"], completed: false });
    expect(repo.predictions.get("u1", "f1", "e", "race")).toEqual(["16", "4", "3"]);
  });

  test("locked once the session starts", () => {
    expect(
      savePick(
        repo,
        { userId: "u1", now: T },
        { series: "f1", eventId: "e", sessionId: "sprint-race" },
        { index: 0, driverId: "3" },
      ),
    ).toEqual({
      ok: false,
      text: "🔒 Predictions for the Chinese Grand Prix Sprint closed at the start.",
    });
    expect(repo.predictions.get("u1", "f1", "e", "sprint-race")).toEqual([null, null, null]);
  });

  test("only races and sprints on the schedule, positions 0 to 2", () => {
    const gone = { ok: false as const, text: "That session isn't open for predictions." };
    expect(
      savePick(
        repo,
        { userId: "u1", now: T },
        { series: "f1", eventId: "e", sessionId: "qualifying" },
        { index: 0, driverId: "3" },
      ),
    ).toEqual(gone);
    expect(
      savePick(
        repo,
        { userId: "u1", now: T },
        { series: "f1", eventId: "x", sessionId: "race" },
        { index: 0, driverId: "3" },
      ),
    ).toEqual(gone);
    expect(
      savePick(
        repo,
        { userId: "u1", now: T },
        { series: "f1", eventId: "e", sessionId: "race" },
        { index: 3, driverId: "3" },
      ),
    ).toEqual(gone);
  });
});

describe("predictionGrid", () => {
  test("drivers of the latest stored result, in finishing order", async () => {
    repo.results.insert({
      series: "f1",
      eventId: "e",
      eventName: "E",
      sessionId: "qualifying",
      kind: "qualifying",
      rows: [
        { pos: "1", id: "3", name: "Verstappen", team: "", time: "" },
        { pos: "2", id: "4", name: "Norris", team: "", time: "" },
      ],
      postedAt: 1,
    });
    expect(await predictionGrid(repo, "f1", T, noFetch)).toEqual([
      { id: "3", name: "Verstappen" },
      { id: "4", name: "Norris" },
    ]);
  });

  test("nothing stored or published: empty", async () => {
    expect(await predictionGrid(repo, "f1", T, notFound)).toEqual([]);
  });
});

describe("predictPicker", () => {
  test("the requested open session, else the first open one", async () => {
    stored();
    const first = await predictPicker(
      repo,
      { userId: "u1", now: T },
      { series: "f1", eventId: "e", sessionId: undefined },
      notFound,
    );
    expect(typeof first === "string" ? first : first.content).toStartWith(
      "🔮 **F1 Chinese Grand Prix Race** podium",
    );
  });

  test("nothing open, or no drivers known yet, explains why", async () => {
    expect(
      await predictPicker(
        repo,
        { userId: "u1", now: T + 86_400_000 },
        { series: "f1", eventId: "e", sessionId: "race" },
        notFound,
      ),
    ).toBe("No races or sprints left to predict this weekend.");
    expect(
      await predictPicker(
        repo,
        { userId: "u1", now: T },
        { series: "f1", eventId: "e", sessionId: "race" },
        notFound,
      ),
    ).toBe("No driver list yet: predictions open once the first session's results are in.");
  });
});

test("season leaderboard counts only this year's results", () => {
  const result = (eventId: string, postedAt: number) =>
    repo.results.insert({
      series: "f1",
      eventId,
      eventName: "E",
      sessionId: "race",
      kind: "race",
      rows: [
        { pos: "1", id: "3", name: "Verstappen", team: "", time: "" },
        { pos: "2", id: "4", name: "Norris", team: "", time: "" },
        { pos: "3", id: "16", name: "Leclerc", team: "", time: "" },
      ],
      postedAt,
    });
  result("last-year", Date.parse("2025-12-07T15:00:00Z"));
  result("e", T);
  repo.predictions.set(
    { userId: "u1", now: 0 },
    { series: "f1", eventId: "last-year", sessionId: "race" },
    ["3", "4", "16"],
  );
  repo.predictions.set(
    { userId: "u1", now: 0 },
    { series: "f1", eventId: "e", sessionId: "race" },
    ["3", "16", "4"],
  );
  expect(seasonLeaderboard(repo, "f1", T)).toBe(
    "## 🔮 F1 predictions — 2026 season\n**1.** <@u1> · **9** pts · 1 race",
  );
});
