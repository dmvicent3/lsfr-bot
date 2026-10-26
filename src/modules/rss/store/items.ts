import type { ItemState, StoredItem, NewItem, ItemRow } from "./types.ts";
import type { Database } from "bun:sqlite";

/** Only this much of a description is ever used (jev reads 1,500 characters). */
const MAX_DESCRIPTION = 1_500;

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

/** rss_items: every article seen per server, by key, and where it is in the pipeline. */
export class ItemStore {
  constructor(private readonly db: Database) {}

  /** False when the server already has an item with this key. */
  insert({ guildId, feedId, key, item, state, now }: NewItem): boolean {
    const { title, link, guid, image, publishedAt } = item;
    const description = item.description.slice(0, MAX_DESCRIPTION);
    const values = [guildId, key, feedId, title, link, guid, description, image, publishedAt];

    return (
      this.db.run(
        `INSERT OR IGNORE INTO rss_items
          (guild_id, item_key, feed_id, title, link, guid, description, image, published_at, state, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [...values, state, now],
      ).changes > 0
    );
  }

  inState(guildId: string, state: ItemState, limit: number): StoredItem[] {
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

  /** Marks an item posted with its story's vector (null when it couldn't be embedded). */
  setPosted(id: number, embedding: Float32Array | null): void {
    const blob =
      embedding && new Uint8Array(embedding.buffer, embedding.byteOffset, embedding.byteLength);
    this.db.run("UPDATE rss_items SET state = 'posted', embedding = ? WHERE id = ?", [blob, id]);
  }

  /** Vectors of the server's posted items created since `since`. */
  recentEmbeddings(guildId: string, since: number): Float32Array[] {
    return this.db
      .query<{ embedding: Uint8Array }, [string, number]>(
        `SELECT embedding FROM rss_items
         WHERE guild_id = ? AND state = 'posted' AND embedding IS NOT NULL AND created_at >= ?`,
      )
      .all(guildId, since)
      .map((r) => new Float32Array(new Uint8Array(r.embedding).slice().buffer));
  }

  /** Waiting items (pending or passed) created before `before` become expired; returns how many. */
  expire(guildId: string, before: number): number {
    return this.db.run(
      `UPDATE rss_items SET state = 'expired'
       WHERE guild_id = ? AND state IN ('pending', 'passed') AND created_at < ?`,
      [guildId, before],
    ).changes;
  }

  /** Finished items (posted, blocked, expired, duplicate) created before `before` are deleted; returns how many. */
  prune(guildId: string, before: number): number {
    return this.db.run(
      `DELETE FROM rss_items
       WHERE guild_id = ? AND state IN ('posted', 'blocked', 'expired', 'duplicate') AND created_at < ?`,
      [guildId, before],
    ).changes;
  }

  /** A feed's items still waiting to be checked or posted; the rest stay for dedupe. */
  dropWaiting(guildId: string, feedId: number): void {
    this.db.run(
      "DELETE FROM rss_items WHERE guild_id = ? AND feed_id = ? AND state IN ('pending', 'passed')",
      [guildId, feedId],
    );
  }
}
