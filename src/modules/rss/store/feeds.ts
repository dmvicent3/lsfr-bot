import type { Feed, FeedRow } from "./types.ts";
import type { Database } from "bun:sqlite";

const toFeed = (r: FeedRow): Feed => ({
  id: r.id,
  guildId: r.guild_id,
  url: r.url,
  name: r.name,
  failures: r.failures,
  warned: r.warned === 1,
});

/** rss_feeds: the feeds each server follows, with their failure streak. */
export class FeedStore {
  constructor(private readonly db: Database) {}

  /** Throws (UNIQUE constraint) when the server already follows this URL. */
  add(guildId: string, url: string, name: string): Feed {
    const row = this.db
      .query<FeedRow, [string, string, string]>(
        "INSERT INTO rss_feeds (guild_id, url, name) VALUES (?, ?, ?) RETURNING *",
      )
      .get(guildId, url, name);

    if (!row) throw new Error("feed insert returned nothing");

    return toFeed(row);
  }

  remove(guildId: string, id: number): boolean {
    return (
      this.db.run("DELETE FROM rss_feeds WHERE guild_id = ? AND id = ?", [guildId, id]).changes > 0
    );
  }

  list(guildId: string): Feed[] {
    return this.db
      .query<FeedRow, [string]>("SELECT * FROM rss_feeds WHERE guild_id = ? ORDER BY id")
      .all(guildId)
      .map(toFeed);
  }

  recordResult(id: number, failures: number, warned: boolean): void {
    this.db.run("UPDATE rss_feeds SET failures = ?, warned = ? WHERE id = ?", [
      failures,
      warned ? 1 : 0,
      id,
    ]);
  }
}
