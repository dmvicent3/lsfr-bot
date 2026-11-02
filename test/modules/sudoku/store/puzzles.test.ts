import { beforeEach, expect, test } from "bun:test";
import type { SudokuRepo } from "../../../../src/modules/sudoku/store/repo.ts";
import { freshDb } from "./fixtures.ts";

let repo: SudokuRepo;

beforeEach(() => {
  repo = freshDb().repo;
});

const puzzle = (givens: string) => ({
  guildId: "g",
  date: "2026-11-03",
  level: "easy" as const,
  givens,
  solution: "2".repeat(81),
});

test("create keeps the first puzzle for a date and level", () => {
  repo.puzzles.create(puzzle("1".repeat(81)));
  const again = repo.puzzles.create(puzzle("3".repeat(81)));
  expect(again.givens).toBe("1".repeat(81));
  expect(repo.puzzles.get("g", "2026-11-03", "easy")?.givens).toBe("1".repeat(81));
});

test("puzzles are per server and level", () => {
  repo.puzzles.create(puzzle("1".repeat(81)));
  expect(repo.puzzles.get("h", "2026-11-03", "easy")).toBeNull();
  expect(repo.puzzles.get("g", "2026-11-03", "hard")).toBeNull();
});
