import { expect, test } from "bun:test";
import { playerStats } from "../../../src/modules/sudoku/stats.ts";
import type { Game, Level } from "../../../src/modules/sudoku/types.ts";
import { EASY, SOLVED } from "./fixtures.ts";

interface Won {
  ms: number;
  points: number;
  streak: number;
}

const game = (date: string, level: Level, { ms, points, streak }: Won): Game => ({
  guildId: "g",
  userId: "u",
  kind: "daily",
  date,
  slot: level,
  level,
  givens: EASY,
  solution: SOLVED,
  cells: SOLVED,
  wrong: "0".repeat(81),
  cursor: 0,
  checks: 0,
  startedAt: 1000,
  solvedAt: 1000 + ms,
  points,
  streak,
  notes: "",
  noteMode: false,
  history: "",
});

test("best and average per level, null without solves", () => {
  const s = playerStats(
    [
      game("2026-11-03", "easy", { ms: 60_000, points: 100, streak: 1 }),
      game("2026-11-04", "easy", { ms: 120_000, points: 110, streak: 2 }),
      game("2026-11-04", "hard", { ms: 300_000, points: 400, streak: 2 }),
    ],
    "2026-11-04",
  );
  expect(s.points).toBe(610);
  expect(s.solved).toEqual({ easy: 2, medium: 0, hard: 1 });
  expect(s.bestMs).toEqual({ easy: 60_000, medium: null, hard: 300_000 });
  expect(s.avgMs).toEqual({ easy: 90_000, medium: null, hard: 300_000 });
});

test("streaks: current lives through yesterday, longest is the max", () => {
  const games = [
    game("2026-11-03", "easy", { ms: 1, points: 1, streak: 1 }),
    game("2026-11-04", "easy", { ms: 1, points: 1, streak: 2 }),
    game("2026-11-05", "easy", { ms: 1, points: 1, streak: 3 }),
    game("2026-11-07", "easy", { ms: 1, points: 1, streak: 1 }),
  ];
  expect(playerStats(games, "2026-11-08").currentStreak).toBe(1);
  expect(playerStats(games, "2026-11-09").currentStreak).toBe(0);
  expect(playerStats(games, "2026-11-09").longestStreak).toBe(3);
});

test("no games", () => {
  expect(playerStats([], "2026-11-04")).toMatchObject({
    points: 0,
    currentStreak: 0,
    longestStreak: 0,
  });
});

test("an unsolved game does not count", () => {
  const open: Game = {
    ...game("2026-11-04", "easy", { ms: 0, points: 0, streak: 0 }),
    solvedAt: null,
    points: null,
    streak: null,
  };
  const s = playerStats(
    [game("2026-11-03", "easy", { ms: 60_000, points: 100, streak: 1 }), open],
    "2026-11-04",
  );
  expect(s.solved.easy).toBe(1);
  expect(s.bestMs.easy).toBe(60_000);
  expect(s.avgMs.easy).toBe(60_000);
});
