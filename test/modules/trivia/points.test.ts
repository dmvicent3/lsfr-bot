import { Database } from "bun:sqlite";
import { expect, test } from "bun:test";
import { runMigrations } from "../../../src/core/db.ts";
import { TRIVIA_DAILY_CAP } from "../../../src/modules/trivia/currency.ts";
import { triviaPoints } from "../../../src/modules/trivia/points.ts";
import { triviaMigrations } from "../../../src/modules/trivia/store/migrations.ts";

const DAY = 86_400_000;
const NOV_1 = Date.UTC(2026, 10, 1, 12);
const LAUNCH = Date.UTC(2026, 10, 6, 12);

function setup(): Database {
  const db = new Database(":memory:", { strict: true });
  runMigrations(db, triviaMigrations);

  return db;
}

function score(db: Database, user: string, points: number, at: number): void {
  db.query(
    `INSERT INTO trivia_scores (guild_id, user_id, session_id, kind, item_id, points, ms, at)
     VALUES ('g', ?, 1, 'typed', 1, ?, 1000, ?)`,
  ).run(user, points, at);
}

const earned = (db: Database, userId = "u"): number =>
  triviaPoints[0]!.earned(db, { guildId: "g", userId });

test("no trivia is no currency", () => {
  expect(earned(setup())).toBe(0);
});

test("a day under the cap counts in full", () => {
  const db = setup();
  score(db, "u", 7, LAUNCH);
  score(db, "u", 6, LAUNCH + 60_000);
  expect(earned(db)).toBe(13);
});

test("from launch day each day is capped on its own, then summed", () => {
  const db = setup();

  for (let k = 0; k < 40; k++) score(db, "u", 7, LAUNCH + k * 1000);

  score(db, "u", 20, LAUNCH + DAY);
  expect(earned(db)).toBe(TRIVIA_DAILY_CAP + 20);
});

test("trivia from before launch counts in full, so no one starts lower", () => {
  const db = setup();

  for (let k = 0; k < 40; k++) score(db, "u", 7, NOV_1 + k * 1000);

  for (let k = 0; k < 40; k++) score(db, "u", 7, LAUNCH + k * 1000);

  expect(earned(db)).toBe(280 + TRIVIA_DAILY_CAP);
});

test("only the player's own points in that server count", () => {
  const db = setup();
  score(db, "u", 5, NOV_1);
  score(db, "v", 9, NOV_1);
  expect(earned(db)).toBe(5);
  expect(earned(db, "v")).toBe(9);
});

test("the cap day follows Lisbon time, like the other dailies", () => {
  const db = setup();
  // In summer Lisbon is UTC+1: 21:30 UTC is 1 Jul there, 23:30 UTC is already 2 Jul.
  const lateJuly1 = Date.UTC(2027, 6, 1, 23, 30);
  score(db, "u", 100, lateJuly1 - 2 * 3_600_000);
  score(db, "u", 100, lateJuly1);
  expect(earned(db)).toBe(200);
});
