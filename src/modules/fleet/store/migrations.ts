import type { Migration } from "../../../core/types.ts";

export const fleetMigrations: Migration[] = [
  {
    id: "fleet-001-init",
    sql: `
      CREATE TABLE fleet_games (
        guild_id TEXT NOT NULL,
        player_id TEXT NOT NULL,
        channel_id TEXT NOT NULL,
        message_id TEXT,
        difficulty TEXT NOT NULL,
        state TEXT NOT NULL,
        started_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        PRIMARY KEY (guild_id, player_id)
      );
      CREATE INDEX fleet_games_by_message ON fleet_games (message_id);
      CREATE TABLE fleet_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        player_id TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        result TEXT NOT NULL,
        how TEXT NOT NULL,
        shots INTEGER NOT NULL,
        hits INTEGER NOT NULL,
        ended_at INTEGER NOT NULL
      );
      CREATE INDEX fleet_results_by_time ON fleet_results (guild_id, ended_at);
      CREATE INDEX fleet_results_by_player ON fleet_results (guild_id, player_id);
    `,
  },
];
