import { expect, test } from "bun:test";
import { dailyStats } from "../../src/core/daily-stats.ts";

const g = (date: string, score: number, streak: number, done = true) => ({
  date,
  score,
  points: score * 10,
  streak,
  finishedAt: done ? 1 : null,
});

test("totals finished games, counting perfect scores and streaks", () => {
  const out = dailyStats(
    [g("2026-11-03", 3, 1), g("2026-11-04", 5, 2), g("2026-11-05", 5, 0, false)],
    "2026-11-05",
    (x) => x.score,
    5,
  );

  expect(out).toEqual({
    points: 80,
    days: 2,
    avgScore: 4,
    perfect: 1,
    currentStreak: 2,
    longestStreak: 2,
  });
});

test("no games gives null average and zero streaks", () => {
  expect(dailyStats([], "2026-11-05", () => 0, 5)).toEqual({
    points: 0,
    days: 0,
    avgScore: null,
    perfect: 0,
    currentStreak: 0,
    longestStreak: 0,
  });
});
