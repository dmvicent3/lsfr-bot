import type { Migration } from "../../../core/types.ts";

export const tictactoeMigrations: Migration[] = [
  {
    id: "tictactoe-001-init",
    sql: `
      CREATE TABLE tictactoe_games (
        guild_id TEXT PRIMARY KEY,
        channel_id TEXT NOT NULL,
        message_id TEXT,
        player_id TEXT NOT NULL,
        board TEXT NOT NULL,
        jevos_mark TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `,
  },
];
