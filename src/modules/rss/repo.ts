import type { Database } from "bun:sqlite";
import type { Migration } from "../../core/db.ts";
import type { FeedItem } from "./parse.ts";
import type { Rule } from "./rules.ts";

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
];

export type ItemState = "pending" | "passed" | "posted" | "blocked" | "expired";

export interface Server {
  guildId: string;
  channelId: string;
  jevDown: boolean;
}

export interface Feed {
  id: number;
  guildId: string;
  url: string;
  name: string;
  failures: number;
  warned: boolean;
}

export interface StoredItem extends FeedItem {
  id: number;
  feedId: number;
  state: ItemState;
  createdAt: number;
}

interface FeedRow {
  id: number;
  guild_id: string;
  url: string;
  name: string;
  failures: number;
  warned: number;
}

interface ItemRow {
  id: number;
  feed_id: number;
  title: string;
  link: string | null;
  guid: string | null;
  description: string;
  image: string | null;
  published_at: number | null;
  state: ItemState;
  created_at: number;
}

const toFeed = (r: FeedRow): Feed => ({
  id: r.id,
  guildId: r.guild_id,
  url: r.url,
  name: r.name,
  failures: r.failures,
  warned: r.warned === 1,
});

const toItem = (r: ItemRow): StoredItem => ({
  id: r.id,
  feedId: r.feed_id,
  title: r.title,
  link: r.link,
  guid: r.guid,
  description: r.description,
  publishedAt: r.published_at,
  image: r.image,
  state: r.state,
  createdAt: r.created_at,
});

export class RssRepo {
  constructor(private readonly db: Database) {}

  /** Servers with a news channel: the only ones checked. */
  servers(): Server[] {
    return this.db
      .query<{ guild_id: string; channel_id: string; jev_down: number }, []>(
        "SELECT guild_id, channel_id, jev_down FROM rss_servers WHERE channel_id IS NOT NULL ORDER BY guild_id",
      )
      .all()
      .map((r) => ({ guildId: r.guild_id, channelId: r.channel_id, jevDown: r.jev_down === 1 }));
  }

  channel(guildId: string): string | null {
    return (
      this.db
        .query<{ channel_id: string | null }, [string]>(
          "SELECT channel_id FROM rss_servers WHERE guild_id = ?",
        )
        .get(guildId)?.channel_id ?? null
    );
  }

  setChannel(guildId: string, channelId: string | null): void {
    this.db.run(
      `INSERT INTO rss_servers (guild_id, channel_id) VALUES (?, ?)
       ON CONFLICT (guild_id) DO UPDATE SET channel_id = excluded.channel_id`,
      [guildId, channelId],
    );
  }

  jevDown(guildId: string): boolean {
    return (
      this.db
        .query<{ jev_down: number }, [string]>(
          "SELECT jev_down FROM rss_servers WHERE guild_id = ?",
        )
        .get(guildId)?.jev_down === 1
    );
  }

  setJevDown(guildId: string, down: boolean): void {
    this.db.run(
      `INSERT INTO rss_servers (guild_id, jev_down) VALUES (?, ?)
       ON CONFLICT (guild_id) DO UPDATE SET jev_down = excluded.jev_down`,
      [guildId, down ? 1 : 0],
    );
  }

  /** Throws (UNIQUE constraint) when the server already follows this URL. */
  addFeed(guildId: string, url: string, name: string): Feed {
    const row = this.db
      .query<FeedRow, [string, string, string]>(
        "INSERT INTO rss_feeds (guild_id, url, name) VALUES (?, ?, ?) RETURNING *",
      )
      .get(guildId, url, name);
    if (!row) throw new Error("feed insert returned nothing");
    return toFeed(row);
  }

  /** Also drops the feed's items still waiting to be checked or posted; the rest stay for dedupe. */
  removeFeed(guildId: string, id: number): boolean {
    return this.db.transaction(() => {
      const removed =
        this.db.run("DELETE FROM rss_feeds WHERE guild_id = ? AND id = ?", [guildId, id]).changes >
        0;
      if (removed) {
        this.db.run(
          "DELETE FROM rss_items WHERE guild_id = ? AND feed_id = ? AND state IN ('pending', 'passed')",
          [guildId, id],
        );
      }
      return removed;
    })();
  }

  feeds(guildId: string): Feed[] {
    return this.db
      .query<FeedRow, [string]>("SELECT * FROM rss_feeds WHERE guild_id = ? ORDER BY id")
      .all(guildId)
      .map(toFeed);
  }

  recordFeedResult(id: number, failures: number, warned: boolean): void {
    this.db.run("UPDATE rss_feeds SET failures = ?, warned = ? WHERE id = ?", [
      failures,
      warned ? 1 : 0,
      id,
    ]);
  }

  addRule(guildId: string, text: string): Rule {
    const row = this.db
      .query<{ id: number; text: string }, [string, string]>(
        "INSERT INTO rss_rules (guild_id, text) VALUES (?, ?) RETURNING id, text",
      )
      .get(guildId, text);
    if (!row) throw new Error("rule insert returned nothing");
    return row;
  }

  removeRule(guildId: string, id: number): boolean {
    return (
      this.db.run("DELETE FROM rss_rules WHERE guild_id = ? AND id = ?", [guildId, id]).changes > 0
    );
  }

  rules(guildId: string): Rule[] {
    return this.db
      .query<{ id: number; text: string }, [string]>(
        "SELECT id, text FROM rss_rules WHERE guild_id = ? ORDER BY id",
      )
      .all(guildId);
  }

  /** False when the server already has an item with this key. */
  insertItem(
    guildId: string,
    feedId: number,
    key: string,
    item: FeedItem,
    state: ItemState,
    now: number,
  ): boolean {
    return (
      this.db.run(
        `INSERT OR IGNORE INTO rss_items
          (guild_id, item_key, feed_id, title, link, guid, description, image, published_at, state, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          guildId,
          key,
          feedId,
          item.title,
          item.link,
          item.guid,
          item.description,
          item.image,
          item.publishedAt,
          state,
          now,
        ],
      ).changes > 0
    );
  }

  itemsIn(guildId: string, state: ItemState, limit: number): StoredItem[] {
    return this.db
      .query<ItemRow, [string, string, number]>(
        "SELECT * FROM rss_items WHERE guild_id = ? AND state = ? ORDER BY created_at, id LIMIT ?",
      )
      .all(guildId, state, limit)
      .map(toItem);
  }

  setState(id: number, state: ItemState): void {
    this.db.run("UPDATE rss_items SET state = ? WHERE id = ?", [state, id]);
  }

  /** Waiting items (pending or passed) created before `before` become expired; returns how many. */
  expire(guildId: string, before: number): number {
    return this.db.run(
      `UPDATE rss_items SET state = 'expired'
       WHERE guild_id = ? AND state IN ('pending', 'passed') AND created_at < ?`,
      [guildId, before],
    ).changes;
  }
}
