import { expect, test } from "bun:test";
import { currentStreak, nextStreak } from "../../../src/modules/word/streak.ts";

test("win after yesterday's win extends", () => {
  expect(nextStreak({ date: "2026-10-28", won: true, streak: 2 }, "2026-10-29", true)).toBe(3);
});

test("win after a skipped day restarts", () => {
  expect(nextStreak({ date: "2026-10-27", won: true, streak: 5 }, "2026-10-29", true)).toBe(1);
});

test("win after yesterday's loss restarts", () => {
  expect(nextStreak({ date: "2026-10-28", won: false, streak: 0 }, "2026-10-29", true)).toBe(1);
});

test("first ever win is 1", () => expect(nextStreak(null, "2026-10-29", true)).toBe(1));

test("a loss resets", () => {
  expect(nextStreak({ date: "2026-10-28", won: true, streak: 4 }, "2026-10-29", false)).toBe(0);
});

test("current streak survives until the day after", () => {
  const last = { date: "2026-10-28", won: true, streak: 4 };
  expect(currentStreak(last, "2026-10-28")).toBe(4);
  expect(currentStreak(last, "2026-10-29")).toBe(4);
  expect(currentStreak(last, "2026-10-30")).toBe(0);
  expect(currentStreak(null, "2026-10-30")).toBe(0);
});
