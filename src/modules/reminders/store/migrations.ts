import type { Migration } from "../../../core/types.ts";

export const remindersMigrations: Migration[] = [
  {
    id: "reminders-001-init",
    sql: `
      CREATE TABLE reminders_reminders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        channel_id TEXT NOT NULL,
        author_id TEXT NOT NULL,
        target_id TEXT NOT NULL,
        target_kind TEXT NOT NULL,
        text TEXT NOT NULL,
        due_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        sent_at INTEGER,
        message_id TEXT
      );
      CREATE INDEX reminders_due ON reminders_reminders (sent_at, due_at);
    `,
  },
];
