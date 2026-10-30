import type { Migration } from "../../../core/types.ts";

export const cardsMigrations: Migration[] = [
  {
    id: "cards-001-init",
    sql: `
      CREATE TABLE cards_custom (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        kind TEXT NOT NULL,
        text TEXT NOT NULL,
        norm TEXT NOT NULL,
        added_by TEXT NOT NULL,
        added_at INTEGER NOT NULL,
        removed_at INTEGER
      );
      CREATE UNIQUE INDEX cards_custom_live ON cards_custom (guild_id, kind, norm) WHERE removed_at IS NULL;
      CREATE TABLE cards_games (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        channel_id TEXT NOT NULL,
        started_by TEXT NOT NULL,
        started_at INTEGER NOT NULL,
        ended_at INTEGER,
        target INTEGER NOT NULL,
        winner_id TEXT
      );
      CREATE UNIQUE INDEX cards_games_live ON cards_games (channel_id) WHERE ended_at IS NULL;
      CREATE TABLE cards_players (
        game_id INTEGER NOT NULL,
        user_id TEXT NOT NULL,
        PRIMARY KEY (game_id, user_id)
      );
      CREATE TABLE cards_wins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_id INTEGER NOT NULL,
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        at INTEGER NOT NULL,
        prompt TEXT NOT NULL,
        votes INTEGER NOT NULL
      );
      CREATE INDEX cards_wins_by_time ON cards_wins (guild_id, at);
      CREATE INDEX cards_wins_by_user ON cards_wins (guild_id, user_id);
    `,
  },
];
