import { expect, test } from "bun:test";
import { playerStats } from "../../../src/modules/word/stats.ts";
import { game } from "./fixtures.ts";

const SIX = Array<string>(6).fill("xxxxx");

test("stats over wins and losses", () => {
  const s = playerStats(
    [
      game("u", "2026-10-27", { guesses: ["a", "b", "c", "d"], points: 120, streak: 1 }),
      game("u", "2026-10-28", { guesses: ["a", "b"], points: 145, streak: 2 }),
      game("u", "2026-10-29", { guesses: SIX, won: false, points: 5, streak: 0 }),
    ],
    "2026-10-29",
  );
  expect(s).toMatchObject({
    points: 270,
    wins: 2,
    losses: 1,
    longestStreak: 2,
    currentStreak: 0,
    totalGuesses: 12,
    avgAttempts: 3,
  });
  expect(s.winRate).toBeCloseTo(2 / 3);
  expect(s.distribution).toEqual([0, 1, 0, 1, 0, 0]);
});

test("current streak is the latest game's while alive", () => {
  const s = playerStats([game("u", "2026-10-28", { streak: 4 })], "2026-10-29");
  expect(s.currentStreak).toBe(4);
});

test("no games", () => {
  expect(playerStats([], "2026-10-29")).toEqual({
    points: 0,
    wins: 0,
    losses: 0,
    winRate: null,
    currentStreak: 0,
    longestStreak: 0,
    totalGuesses: 0,
    avgAttempts: null,
    distribution: [0, 0, 0, 0, 0, 0],
  });
});
