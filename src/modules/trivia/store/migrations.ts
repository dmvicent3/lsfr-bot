import type { Migration } from "../../../core/types.ts";

export const triviaMigrations: Migration[] = [
  {
    id: "trivia-001-init",
    sql: `
      CREATE TABLE trivia_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        channel_id TEXT NOT NULL,
        started_by TEXT NOT NULL,
        started_at INTEGER NOT NULL,
        ended_at INTEGER
      );
      CREATE UNIQUE INDEX trivia_sessions_live ON trivia_sessions (channel_id) WHERE ended_at IS NULL;
      CREATE TABLE trivia_asked (
        guild_id TEXT NOT NULL,
        channel_id TEXT NOT NULL,
        kind TEXT NOT NULL,
        item_id INTEGER NOT NULL,
        asked_at INTEGER NOT NULL
      );
      CREATE INDEX trivia_asked_by_item ON trivia_asked (guild_id, kind, item_id);
      CREATE INDEX trivia_asked_by_channel ON trivia_asked (channel_id, asked_at);
      CREATE TABLE trivia_scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        session_id INTEGER NOT NULL,
        kind TEXT NOT NULL,
        item_id INTEGER NOT NULL,
        points INTEGER NOT NULL,
        ms INTEGER NOT NULL,
        at INTEGER NOT NULL
      );
      CREATE INDEX trivia_scores_by_time ON trivia_scores (guild_id, at);
      CREATE INDEX trivia_scores_by_user ON trivia_scores (guild_id, user_id);
      CREATE TABLE trivia_records (
        guild_id TEXT NOT NULL,
        question_id INTEGER NOT NULL,
        user_id TEXT NOT NULL,
        ms INTEGER NOT NULL,
        at INTEGER NOT NULL,
        PRIMARY KEY (guild_id, question_id)
      );
      CREATE TABLE trivia_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        kind TEXT NOT NULL,
        item_id INTEGER NOT NULL,
        user_id TEXT NOT NULL,
        reason TEXT,
        at INTEGER NOT NULL
      );
      CREATE TABLE trivia_topic_picks (
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        category TEXT NOT NULL,
        at INTEGER NOT NULL
      );
      CREATE TABLE trivia_button_picks (
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        question_id INTEGER NOT NULL,
        right INTEGER NOT NULL,
        at INTEGER NOT NULL
      );
      CREATE INDEX trivia_button_picks_by_user ON trivia_button_picks (guild_id, user_id);
    `,
  },
];
