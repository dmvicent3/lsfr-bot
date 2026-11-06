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
  {
    id: "minesweeper-002-controls",
    sql: "ALTER TABLE minesweeper_games ADD COLUMN controls TEXT NOT NULL DEFAULT 'menus';",
  },
  {
    id: "minesweeper-003-daily",
    sql: `
      ALTER TABLE minesweeper_games ADD COLUMN kind TEXT NOT NULL DEFAULT 'practice';
      ALTER TABLE minesweeper_games ADD COLUMN date TEXT;
      ALTER TABLE minesweeper_games ADD COLUMN level TEXT;
      ALTER TABLE minesweeper_games ADD COLUMN clicks INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE minesweeper_games ADD COLUMN bbbv INTEGER;
      ALTER TABLE minesweeper_games ADD COLUMN points INTEGER;
      ALTER TABLE minesweeper_games ADD COLUMN streak INTEGER;
      CREATE UNIQUE INDEX minesweeper_daily_one
        ON minesweeper_games (guild_id, player_id, date) WHERE kind = 'daily';
    `,
  },
];
