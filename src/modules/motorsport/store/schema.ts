import type { Migration } from "../../../core/types.ts";

/** The original tables: follows, sessions, reminders and sent pings. */
export const INIT: Migration = {
  id: "motorsport-001-init",
  sql: `
      CREATE TABLE motorsport_followed (
        series TEXT PRIMARY KEY,
        channel_id TEXT NOT NULL,
        role_id TEXT NOT NULL,
        pinned_message_id TEXT NOT NULL,
        pinned_event_id TEXT,
        channel_name TEXT,
        renamed_at INTEGER
      );
      CREATE TABLE motorsport_sessions (
        series TEXT NOT NULL,
        event_id TEXT NOT NULL,
        event_name TEXT NOT NULL,
        session_id TEXT NOT NULL,
        title TEXT NOT NULL,
        start INTEGER NOT NULL,
        end INTEGER NOT NULL,
        pingable INTEGER NOT NULL,
        fetched_at INTEGER NOT NULL,
        PRIMARY KEY (series, event_id, session_id)
      );
      CREATE TABLE motorsport_one_off (
        user_id TEXT NOT NULL,
        series TEXT NOT NULL,
        event_id TEXT NOT NULL,
        session_id TEXT NOT NULL,
        PRIMARY KEY (user_id, series, event_id, session_id)
      );
      CREATE TABLE motorsport_sent_pings (
        series TEXT NOT NULL,
        event_id TEXT NOT NULL,
        session_id TEXT NOT NULL,
        channel_id TEXT NOT NULL,
        message_id TEXT,
        delete_at INTEGER NOT NULL,
        PRIMARY KEY (series, event_id, session_id)
      );
    `,
};
