import { Database } from "bun:sqlite";
import { expect, test } from "bun:test";
import { runMigrations } from "../../../../src/core/db.ts";
import { sudokuMigrations } from "../../../../src/modules/sudoku/store/migrations.ts";
import { SudokuRepo } from "../../../../src/modules/sudoku/store/repo.ts";
import { game } from "./fixtures.ts";

test("notes columns arrive on an existing game with no notes and digit mode", () => {
  const db = new Database(":memory:", { strict: true });
  runMigrations(db, sudokuMigrations.slice(0, 1));
  db.run(
    `INSERT INTO sudoku_games (guild_id, user_id, kind, date, slot, level, givens, solution,
       cells, wrong, cursor, started_at) VALUES ('g', 'u', 'daily', '2026-11-03', 'easy', 'easy',
       '1', '2', '1', '0', 0, 1)`,
  );
  runMigrations(db, sudokuMigrations);

  const got = new SudokuRepo(db).games.get(game());

  expect(got?.notes).toBe("");
  expect(got?.noteMode).toBe(false);
});
