import { expect, test } from "bun:test";
import { rankOf, standings } from "../../../src/modules/sudoku/ranking.ts";
import type { Game } from "../../../src/modules/sudoku/types.ts";
import { EASY, SOLVED } from "./fixtures.ts";

const game = (userId: string, points: number, solvedAt: number, date = "2026-11-03"): Game => ({
  guildId: "g",
  userId,
  kind: "daily",
  date,
  slot: "easy",
  level: "easy",
  givens: EASY,
  solution: SOLVED,
  cells: SOLVED,
  wrong: "0".repeat(81),
  cursor: 0,
  checks: 0,
  startedAt: 0,
  solvedAt,
  points,
  streak: 1,
});

test("sums points per player, highest first", () => {
  const list = standings([game("a", 100, 5), game("b", 300, 6), game("a", 250, 7, "2026-11-04")]);
  expect(list.map((s) => [s.userId, s.points, s.solved])).toEqual([
    ["a", 350, 2],
    ["b", 300, 1],
  ]);
});

test("ties go to more solves, then the earlier last solve, then user ID", () => {
  const list = standings([
    game("a", 100, 9),
    game("b", 50, 1),
    game("b", 50, 2, "2026-11-04"),
    game("c", 100, 3),
    game("d", 100, 3),
  ]);
  expect(list.map((s) => s.userId)).toEqual(["b", "c", "d", "a"]);
  expect(list[0]?.lastSolvedAt).toBe(2);
});

test("rankOf is 1-based and null for strangers", () => {
  const list = standings([game("a", 100, 1), game("b", 200, 2)]);
  expect(rankOf(list, "a")).toBe(2);
  expect(rankOf(list, "z")).toBeNull();
});
