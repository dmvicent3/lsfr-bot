import { Database } from "bun:sqlite";
import { expect, test } from "bun:test";
import { runMigrations } from "../../../src/core/db.ts";
import { motorsportPoints } from "../../../src/modules/motorsport/points.ts";
import { MotorsportRepo } from "../../../src/modules/motorsport/repo.ts";
import type { ResultKind } from "../../../src/modules/motorsport/results/types.ts";
import { motorsportMigrations } from "../../../src/modules/motorsport/store/migrations.ts";
import type { SessionRef } from "../../../src/modules/motorsport/types.ts";

const ROWS = [
  { pos: "1", id: "3", name: "Verstappen", team: "", time: "" },
  { pos: "2", id: "4", name: "Norris", team: "", time: "" },
  { pos: "3", id: "16", name: "Leclerc", team: "", time: "" },
];

test("F1 predictions pay pulls after chips, all time, in the home server only", () => {
  const db = new Database(":memory:", { strict: true });
  runMigrations(db, motorsportMigrations);
  const repo = new MotorsportRepo(db);

  /** 5 + 2 + 2 = 9 points. */
  const predict = (ref: SessionRef, kind: ResultKind) => {
    repo.results.insert({ ...ref, eventName: "E", kind, rows: ROWS, postedAt: 1 });
    repo.predictions.set({ userId: "u", now: 0 }, ref, ["3", "16", "4"]);
  };

  predict({ series: "f1", eventId: "last-year", sessionId: "race" }, "race");
  predict({ series: "f1", eventId: "e", sessionId: "qualifying" }, "qualifying");
  predict({ series: "motogp", eventId: "e", sessionId: "race" }, "race");
  const double = { kind: "double" as const, sessionId: null, position: null };
  repo.chips.set({ series: "f1", season: 2026, eventId: "e" }, "u", double, 0);
  const [source] = motorsportPoints("home");

  expect(source).toMatchObject({ game: "f1-predictions", label: "F1 predictions", unit: "pulls" });
  // Race 9 pts → 9 pulls; qualifying 9 × 2 = 18 pts → 9 pulls.
  expect(source?.earned(db, { guildId: "home", userId: "u" })).toBe(18);
  expect(source?.earned(db, { guildId: "other", userId: "u" })).toBe(0);
  expect(source?.earned(db, { guildId: "home", userId: "nobody" })).toBe(0);
});
