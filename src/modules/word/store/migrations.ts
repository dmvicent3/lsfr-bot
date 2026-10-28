import type { Migration } from "../../../core/types.ts";

export const wordMigrations: Migration[] = [
  {
    id: "word-001-init",
    sql: `
      CREATE TABLE word_puzzles (
        guild_id TEXT NOT NULL,
        date TEXT NOT NULL,
        word TEXT NOT NULL,
        length INTEGER NOT NULL,
        PRIMARY KEY (guild_id, date)
      );
      CREATE TABLE word_games (
        guild_id TEXT NOT NULL,
        date TEXT NOT NULL,
        user_id TEXT NOT NULL,
        guesses TEXT NOT NULL,
        won INTEGER,
        points INTEGER,
        streak INTEGER,
        finished_at INTEGER,
        PRIMARY KEY (guild_id, date, user_id)
      );
      CREATE INDEX word_games_by_user ON word_games (guild_id, user_id, date);
    `,
  },
];
