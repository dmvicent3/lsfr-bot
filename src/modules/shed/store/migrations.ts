import type { Migration } from "../../../core/types.ts";

export const shedMigrations: Migration[] = [
  {
    id: "shed-001-init",
    sql: `
      CREATE TABLE shed_games (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        channel_id TEXT NOT NULL,
        started_by TEXT NOT NULL,
        started_at INTEGER NOT NULL,
        ended_at INTEGER,
        stacking INTEGER NOT NULL,
        players INTEGER,
        message_id TEXT
      );
      CREATE UNIQUE INDEX shed_games_live ON shed_games (channel_id) WHERE ended_at IS NULL;
      CREATE TABLE shed_places (
        game_id INTEGER NOT NULL,
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        place INTEGER NOT NULL,
        points INTEGER NOT NULL,
        finished_at INTEGER NOT NULL,
        PRIMARY KEY (game_id, user_id)
      );
      CREATE INDEX shed_places_by_time ON shed_places (guild_id, finished_at);
      CREATE INDEX shed_places_by_user ON shed_places (guild_id, user_id);
    `,
  },
];
