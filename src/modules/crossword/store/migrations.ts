import type { Migration } from "../../../core/types.ts";

export const crosswordMigrations: Migration[] = [
  {
    id: "crossword-001-init",
    sql: `
      CREATE TABLE crossword_puzzles (
        guild_id TEXT NOT NULL, date TEXT NOT NULL,
        puzzle TEXT NOT NULL, clues TEXT NOT NULL,
        PRIMARY KEY (guild_id, date)
      );
      CREATE TABLE crossword_games (
        guild_id TEXT NOT NULL, date TEXT NOT NULL, user_id TEXT NOT NULL,
        cells TEXT NOT NULL, wrong INTEGER NOT NULL DEFAULT 0, reveals INTEGER NOT NULL DEFAULT 0,
        last_line TEXT, solved INTEGER, points INTEGER, streak INTEGER,
        started_at INTEGER NOT NULL, finished_at INTEGER,
        PRIMARY KEY (guild_id, date, user_id)
      );
      CREATE INDEX crossword_games_by_day ON crossword_games (guild_id, date) WHERE finished_at IS NOT NULL;
      CREATE TABLE crossword_practice (
        guild_id TEXT NOT NULL, user_id TEXT NOT NULL,
        puzzle TEXT NOT NULL, clues TEXT NOT NULL,
        cells TEXT NOT NULL, wrong INTEGER NOT NULL DEFAULT 0, reveals INTEGER NOT NULL DEFAULT 0,
        last_line TEXT, started_at INTEGER NOT NULL, finished_at INTEGER,
        PRIMARY KEY (guild_id, user_id)
      );
    `,
  },
];
