import { expect, test } from "bun:test";
import { playerStats } from "../../../src/modules/duel/stats.ts";
import type { Game } from "../../../src/modules/duel/types.ts";

const game = (date: string, correct: number, points: number, streak: number): Game => ({
  guildId: "g",
  date,
  userId: "u",
  answers: "",
  correct,
  points,
  streak,
  startedAt: 0,
  finishedAt: 1,
});

test("points, days, average correct and perfect days", () => {
  const s = playerStats(
    [game("2026-11-03", 5, 120, 1), game("2026-11-04", 2, 50, 2), game("2026-11-05", 5, 135, 3)],
    "2026-11-05",
  );
  expect(s).toMatchObject({ points: 305, days: 3, perfect: 2 });
  expect(s.avgCorrect).toBeCloseTo(4);
});

test("streaks: current lives through yesterday, longest is the max", () => {
  const games = [
    game("2026-11-03", 1, 1, 1),
    game("2026-11-04", 1, 1, 2),
    game("2026-11-05", 1, 1, 3),
    game("2026-11-07", 1, 1, 1),
  ];
  expect(playerStats(games, "2026-11-08").currentStreak).toBe(1);
  expect(playerStats(games, "2026-11-09").currentStreak).toBe(0);
  expect(playerStats(games, "2026-11-09").longestStreak).toBe(3);
});

test("no games", () => {
  expect(playerStats([], "2026-11-04")).toEqual({
    points: 0,
    days: 0,
    avgCorrect: null,
    perfect: 0,
    currentStreak: 0,
    longestStreak: 0,
  });
});

test("an unfinished game does not count", () => {
  const open: Game = {
    ...game("2026-11-04", 0, 0, 0),
    finishedAt: null,
    correct: null,
    points: null,
    streak: null,
  };
  const s = playerStats([game("2026-11-03", 4, 80, 1), open], "2026-11-04");
  expect(s).toMatchObject({ days: 1, avgCorrect: 4, currentStreak: 1 });
});
