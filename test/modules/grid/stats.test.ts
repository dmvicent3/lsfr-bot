import { expect, test } from "bun:test";
import { playerStats } from "../../../src/modules/grid/stats.ts";
import type { Game } from "../../../src/modules/grid/types.ts";

const g = (date: string, filled: number, points: number, streak: number): Game => ({
  guildId: "g",
  date,
  userId: "u",
  cells: [],
  guesses: 9,
  lastMiss: null,
  filled,
  points,
  streak,
  startedAt: 0,
  finishedAt: 1,
});

test("points, days, average filled and perfect grids", () => {
  const s = playerStats(
    [g("2026-11-03", 9, 230, 1), g("2026-11-04", 3, 50, 2), g("2026-11-05", 9, 260, 3)],
    "2026-11-05",
  );

  expect(s).toMatchObject({ points: 540, days: 3, perfect: 2, currentStreak: 3, longestStreak: 3 });
  expect(s.avgFilled).toBeCloseTo(7);
});

test("current streak lives through yesterday only", () => {
  const games = [g("2026-11-03", 1, 1, 1), g("2026-11-04", 1, 1, 2)];

  expect(playerStats(games, "2026-11-05").currentStreak).toBe(2);
  expect(playerStats(games, "2026-11-06").currentStreak).toBe(0);
});

test("no games, and unfinished games ignored", () => {
  expect(playerStats([], "2026-11-04")).toEqual({
    points: 0,
    days: 0,
    avgFilled: null,
    perfect: 0,
    currentStreak: 0,
    longestStreak: 0,
  });
  const open: Game = { ...g("2026-11-04", 0, 0, 0), finishedAt: null };

  expect(playerStats([open], "2026-11-04").days).toBe(0);
});
