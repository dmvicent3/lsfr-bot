import type { Migration } from "../../../core/db.ts";

export const rssMigrations: Migration[] = [
  {
    id: "rss-001-init",
    sql: `
      CREATE TABLE rss_servers (
        guild_id TEXT PRIMARY KEY,
        channel_id TEXT,
        jev_down INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE rss_feeds (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        url TEXT NOT NULL,
        name TEXT NOT NULL,
        failures INTEGER NOT NULL DEFAULT 0,
        warned INTEGER NOT NULL DEFAULT 0,
        UNIQUE (guild_id, url)
      );
      CREATE TABLE rss_rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        text TEXT NOT NULL
      );
      CREATE TABLE rss_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        item_key TEXT NOT NULL,
        feed_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        link TEXT,
        guid TEXT,
        description TEXT NOT NULL,
        image TEXT,
        published_at INTEGER,
        state TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        UNIQUE (guild_id, item_key)
      );
      CREATE INDEX rss_items_state ON rss_items (guild_id, state, created_at);
    `,
  },
  {
    id: "rss-002-rule-kinds",
    sql: `
      ALTER TABLE rss_rules ADD COLUMN kind TEXT NOT NULL DEFAULT 'block';
      CREATE TABLE rss_rule_feeds (
        rule_id INTEGER NOT NULL,
        feed_id INTEGER NOT NULL,
        PRIMARY KEY (rule_id, feed_id)
      );
    `,
  },
];
