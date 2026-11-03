import type { Migration } from "../../../core/types.ts";

export const feedbackMigrations: Migration[] = [
  {
    id: "feedback-001-init",
    sql: `
      CREATE TABLE feedback_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL, user_id TEXT NOT NULL, topic TEXT NOT NULL, text TEXT NOT NULL,
        channel_id TEXT, message_id TEXT,
        created_at INTEGER NOT NULL, edited_at INTEGER, removed_at INTEGER, read_at INTEGER
      );
      CREATE TABLE feedback_polls (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL, channel_id TEXT NOT NULL, message_id TEXT NOT NULL,
        question TEXT NOT NULL, options TEXT NOT NULL, multi INTEGER NOT NULL,
        created_at INTEGER NOT NULL, ends_at INTEGER NOT NULL
      );
    `,
  },
];
