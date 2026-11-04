import type { SeriesKey } from "../types.ts";
import type { Database } from "bun:sqlite";

/** motorsport_channel_posts: weekend posts in a series channel, deleted at the wrap-up. */
export class ChannelPostStore {
  constructor(private readonly db: Database) {}

  add(s: SeriesKey, eventId: string, messageId: string): void {
    this.db.run(
      "INSERT OR IGNORE INTO motorsport_channel_posts (message_id, series, event_id) VALUES (?, ?, ?)",
      [messageId, s, eventId],
    );
  }

  list(s: SeriesKey, eventId: string): string[] {
    return this.db
      .query<{ message_id: string }, [string, string]>(
        "SELECT message_id FROM motorsport_channel_posts WHERE series = ? AND event_id = ?",
      )
      .all(s, eventId)
      .map((row) => row.message_id);
  }

  remove(messageId: string): void {
    this.db.run("DELETE FROM motorsport_channel_posts WHERE message_id = ?", [messageId]);
  }
}
