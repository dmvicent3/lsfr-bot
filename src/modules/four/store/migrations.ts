import type { Migration } from "../../../core/types.ts";

export const fourMigrations: Migration[] = [
  {
    id: "four-001-init",
    sql: `
      CREATE TABLE four_games (
        guild_id TEXT NOT NULL,
        player_id TEXT NOT NULL,
        channel_id TEXT NOT NULL,
        message_id TEXT,
        board TEXT NOT NULL,
        first TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        started_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        PRIMARY KEY (guild_id, player_id)
      );
      CREATE INDEX four_games_by_message ON four_games (message_id);
      CREATE TABLE four_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        player_id TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        result TEXT NOT NULL,
        how TEXT NOT NULL,
        moves INTEGER NOT NULL,
        ended_at INTEGER NOT NULL
      );
      CREATE INDEX four_results_by_time ON four_results (guild_id, ended_at);
      CREATE INDEX four_results_by_player ON four_results (guild_id, player_id);
    `,
  },
];
