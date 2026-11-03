import { Database } from "bun:sqlite";
import { runMigrations } from "../../../../src/core/db.ts";
import { sudokuMigrations } from "../../../../src/modules/sudoku/store/migrations.ts";
import { SudokuRepo } from "../../../../src/modules/sudoku/store/repo.ts";
import type { Game } from "../../../../src/modules/sudoku/types.ts";

export function freshDb(): { db: Database; repo: SudokuRepo } {
  const db = new Database(":memory:", { strict: true });
  runMigrations(db, sudokuMigrations);

  return { db, repo: new SudokuRepo(db) };
}

const GIVENS = "1".repeat(81);

/** An unsolved daily easy game for user "u" on 2026-11-03 unless overridden. */
export const game = (over: Partial<Game> = {}): Game => ({
  guildId: "g",
  userId: "u",
  kind: "daily",
  date: "2026-11-03",
  slot: "easy",
  level: "easy",
  givens: GIVENS,
  solution: "2".repeat(81),
  cells: GIVENS,
  wrong: "0".repeat(81),
  cursor: 0,
  checks: 0,
  startedAt: 1,
  solvedAt: null,
  points: null,
  streak: null,
  notes: "",
  noteMode: false,
  history: "",
  ...over,
});
