import { beforeEach, expect, test } from "bun:test";
import { dailyStreak } from "../../../../src/modules/sudoku/play/streak.ts";
import type { SudokuRepo } from "../../../../src/modules/sudoku/store/repo.ts";
import { freshDb, game } from "../store/fixtures.ts";

let repo: SudokuRepo;

beforeEach(() => {
  repo = freshDb().repo;
});

const solved = (date: string, streak: number, slot = "easy") =>
  repo.games.start(game({ date, slot, solvedAt: 5, points: 50, streak }));

test("a first solve is day 1", () => {
  expect(dailyStreak(repo, game())).toBe(1);
});

test("solving after yesterday extends", () => {
  solved("2026-11-02", 3);
  expect(dailyStreak(repo, game())).toBe(4);
});

test("a gap restarts at 1", () => {
  solved("2026-10-30", 3);
  expect(dailyStreak(repo, game())).toBe(1);
});

test("a second solve the same day keeps the streak", () => {
  solved("2026-11-02", 3);
  solved("2026-11-03", 4, "medium");
  expect(dailyStreak(repo, game({ slot: "hard", level: "hard" }))).toBe(4);
});
