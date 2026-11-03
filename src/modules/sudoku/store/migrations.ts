import type { Migration } from "../../../core/types.ts";

export const sudokuMigrations: Migration[] = [
  {
    id: "sudoku-001-init",
    sql: `
      CREATE TABLE sudoku_puzzles (
        guild_id TEXT NOT NULL,
        date TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        givens TEXT NOT NULL,
        solution TEXT NOT NULL,
        PRIMARY KEY (guild_id, date, difficulty)
      );
      CREATE TABLE sudoku_games (
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        kind TEXT NOT NULL,
        date TEXT NOT NULL,
        slot TEXT NOT NULL,
        level TEXT NOT NULL,
        givens TEXT NOT NULL,
        solution TEXT NOT NULL,
        cells TEXT NOT NULL,
        wrong TEXT NOT NULL,
        cursor INTEGER NOT NULL,
        checks INTEGER NOT NULL DEFAULT 0,
        started_at INTEGER NOT NULL,
        solved_at INTEGER,
        points INTEGER,
        streak INTEGER,
        PRIMARY KEY (guild_id, user_id, kind, date, slot)
      );
      CREATE INDEX sudoku_games_by_day ON sudoku_games (guild_id, kind, date);
    `,
  },
  {
    id: "sudoku-002-notes",
    sql: `
      ALTER TABLE sudoku_games ADD COLUMN notes TEXT NOT NULL DEFAULT '';
      ALTER TABLE sudoku_games ADD COLUMN note_mode INTEGER NOT NULL DEFAULT 0;
    `,
  },
];
