import type { Migration } from "../../../core/types.ts";

export const gachaMigrations: Migration[] = [
  {
    id: "gacha-001-init",
    sql: `
      CREATE TABLE gacha_pity (
        guild_id TEXT NOT NULL, user_id TEXT NOT NULL, banner TEXT NOT NULL,
        five INTEGER NOT NULL, four INTEGER NOT NULL,
        guarantee_five INTEGER NOT NULL, guarantee_four INTEGER NOT NULL,
        PRIMARY KEY (guild_id, user_id, banner)
      );
      CREATE TABLE gacha_owned (
        guild_id TEXT NOT NULL, user_id TEXT NOT NULL, driver_id TEXT NOT NULL,
        copies INTEGER NOT NULL, first_at INTEGER NOT NULL,
        PRIMARY KEY (guild_id, user_id, driver_id)
      );
      CREATE TABLE gacha_pulls (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL, user_id TEXT NOT NULL, banner TEXT NOT NULL,
        driver_id TEXT NOT NULL, tier INTEGER NOT NULL, featured INTEGER NOT NULL,
        level INTEGER NOT NULL, cost INTEGER NOT NULL, refund INTEGER NOT NULL, at INTEGER NOT NULL
      );
      CREATE INDEX gacha_pulls_by_user ON gacha_pulls (guild_id, user_id, id);
      CREATE TABLE gacha_banners (
        guild_id TEXT NOT NULL, week TEXT NOT NULL,
        five TEXT NOT NULL, fours TEXT NOT NULL,
        voted_five INTEGER NOT NULL, voted_fours INTEGER NOT NULL, started_at INTEGER NOT NULL,
        PRIMARY KEY (guild_id, week)
      );
      CREATE TABLE gacha_polls (
        guild_id TEXT NOT NULL, week TEXT NOT NULL, kind TEXT NOT NULL,
        channel_id TEXT, message_id TEXT, options TEXT NOT NULL, ends_at INTEGER NOT NULL,
        PRIMARY KEY (guild_id, week, kind)
      );
    `,
  },
];
