import type { Migration } from "../../../core/types.ts";

export const snakeMigrations: Migration[] = [
  {
    id: "snake-001-init",
    sql: `
      CREATE TABLE snake_puzzles (
        guild_id TEXT NOT NULL, date TEXT NOT NULL, answer TEXT NOT NULL,
        PRIMARY KEY (guild_id, date)
      );
      CREATE TABLE snake_games (
        guild_id TEXT NOT NULL, date TEXT NOT NULL, user_id TEXT NOT NULL,
        guesses TEXT NOT NULL, solved INTEGER, points INTEGER, streak INTEGER,
        started_at INTEGER NOT NULL, finished_at INTEGER,
        PRIMARY KEY (guild_id, date, user_id)
      );
      CREATE INDEX snake_games_by_day ON snake_games (guild_id, date) WHERE finished_at IS NOT NULL;
      CREATE TABLE snake_practice (
        guild_id TEXT NOT NULL, user_id TEXT NOT NULL, answer TEXT NOT NULL,
        guesses TEXT NOT NULL, started_at INTEGER NOT NULL, finished_at INTEGER,
        PRIMARY KEY (guild_id, user_id)
      );
    `,
  },
];
