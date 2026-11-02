import type { Migration } from "../../../core/types.ts";

export const duelMigrations: Migration[] = [
  {
    id: "duel-001-init",
    sql: `
      CREATE TABLE duel_puzzles (
        guild_id TEXT NOT NULL,
        date TEXT NOT NULL,
        questions TEXT NOT NULL,
        PRIMARY KEY (guild_id, date)
      );
      CREATE TABLE duel_games (
        guild_id TEXT NOT NULL,
        date TEXT NOT NULL,
        user_id TEXT NOT NULL,
        answers TEXT NOT NULL DEFAULT '',
        correct INTEGER,
        points INTEGER,
        streak INTEGER,
        started_at INTEGER NOT NULL,
        finished_at INTEGER,
        PRIMARY KEY (guild_id, date, user_id)
      );
      CREATE INDEX duel_games_by_day ON duel_games (guild_id, date);
    `,
  },
];
