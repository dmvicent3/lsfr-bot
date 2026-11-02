import type { Game } from "../../../../src/modules/sudoku/types.ts";
import { EASY, EASY_SOLUTION } from "../fixtures.ts";

/** An untouched daily easy game for 2026-11-05 (puzzle #3). */
export const GAME: Game = {
  guildId: "g",
  userId: "u",
  kind: "daily",
  date: "2026-11-05",
  slot: "easy",
  level: "easy",
  givens: EASY,
  solution: EASY_SOLUTION,
  cells: EASY,
  wrong: "0".repeat(81),
  cursor: 0,
  checks: 0,
  startedAt: 0,
  solvedAt: null,
  points: null,
  streak: null,
};
