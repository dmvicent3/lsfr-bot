import type { Migration } from "../../../core/types.ts";

export const minesweeperMigrations: Migration[] = [
  {
    id: "minesweeper-001-init",
    sql: `
      CREATE TABLE minesweeper_games (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        channel_id TEXT NOT NULL,
        message_id TEXT,
        player_id TEXT NOT NULL,
        width INTEGER NOT NULL,
        height INTEGER NOT NULL,
        mines INTEGER NOT NULL,
        field TEXT,
        cells TEXT NOT NULL,
        cursor INTEGER NOT NULL,
        hit INTEGER,
        created_at INTEGER NOT NULL,
        started_at INTEGER,
        finished_at INTEGER,
        result TEXT
      );
      CREATE INDEX minesweeper_games_player
        ON minesweeper_games (guild_id, player_id, finished_at);
    `,
  },
];
