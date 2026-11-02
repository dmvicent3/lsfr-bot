import type { Migration } from "../../../core/types.ts";

export const gridMigrations: Migration[] = [
  {
    id: "grid-001-init",
    sql: `
      CREATE TABLE grid_puzzles (
        guild_id TEXT NOT NULL, date TEXT NOT NULL,
        rows TEXT NOT NULL, cols TEXT NOT NULL, answers TEXT NOT NULL,
        PRIMARY KEY (guild_id, date)
      );
      CREATE TABLE grid_games (
        guild_id TEXT NOT NULL, date TEXT NOT NULL, user_id TEXT NOT NULL,
        cells TEXT NOT NULL DEFAULT '["","","","","","","","",""]',
        guesses INTEGER NOT NULL DEFAULT 0,
        last_miss TEXT,
        filled INTEGER, points INTEGER, streak INTEGER,
        started_at INTEGER NOT NULL, finished_at INTEGER,
        PRIMARY KEY (guild_id, date, user_id)
      );
      CREATE INDEX grid_games_by_day ON grid_games (guild_id, date) WHERE finished_at IS NOT NULL;
      CREATE TABLE grid_practice (
        guild_id TEXT NOT NULL, user_id TEXT NOT NULL,
        rows TEXT NOT NULL, cols TEXT NOT NULL, answers TEXT NOT NULL,
        cells TEXT NOT NULL, guesses INTEGER NOT NULL DEFAULT 0, last_miss TEXT,
        points INTEGER NOT NULL DEFAULT 0,
        started_at INTEGER NOT NULL, finished_at INTEGER,
        PRIMARY KEY (guild_id, user_id)
      );
    `,
  },
];
