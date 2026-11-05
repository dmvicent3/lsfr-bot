import type { Migration } from "../../../core/types.ts";

export const groupsMigrations: Migration[] = [
  {
    id: "groups-001-init",
    sql: `
      CREATE TABLE groups_puzzles (
        guild_id TEXT NOT NULL, date TEXT NOT NULL, puzzle TEXT NOT NULL,
        PRIMARY KEY (guild_id, date)
      );
      CREATE TABLE groups_games (
        guild_id TEXT NOT NULL, date TEXT NOT NULL, user_id TEXT NOT NULL,
        word_order TEXT NOT NULL, picked TEXT NOT NULL, found TEXT NOT NULL,
        guesses TEXT NOT NULL, mistakes INTEGER NOT NULL, last_line TEXT,
        solved INTEGER, points INTEGER, streak INTEGER,
        started_at INTEGER NOT NULL, finished_at INTEGER,
        PRIMARY KEY (guild_id, date, user_id)
      );
      CREATE INDEX groups_games_by_day ON groups_games (guild_id, date) WHERE finished_at IS NOT NULL;
      CREATE TABLE groups_practice (
        guild_id TEXT NOT NULL, user_id TEXT NOT NULL, puzzle TEXT NOT NULL,
        word_order TEXT NOT NULL, picked TEXT NOT NULL, found TEXT NOT NULL,
        guesses TEXT NOT NULL, mistakes INTEGER NOT NULL, last_line TEXT,
        started_at INTEGER NOT NULL, finished_at INTEGER,
        PRIMARY KEY (guild_id, user_id)
      );
    `,
  },
];
