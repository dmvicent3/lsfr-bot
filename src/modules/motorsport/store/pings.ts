import type { DueRow } from "./types.ts";
import type { DuePing, SentPing, SeriesKey } from "../types.ts";
import { toSeriesKey } from "../series.ts";
import type { Database } from "bun:sqlite";

/** motorsport_sent_pings: which sessions were pinged, and when each ping is deleted. */
export class PingStore {
  constructor(private readonly db: Database) {}

  sentKeys(s: SeriesKey): Set<string> {
    const rows = this.db
      .query<{ event_id: string; session_id: string }, [string]>(
        "SELECT event_id, session_id FROM motorsport_sent_pings WHERE series = ?",
      )
      .all(s);

    return new Set(rows.map((row) => `${row.event_id}/${row.session_id}`));
  }

  insert(p: SentPing): void {
    this.db.run(
      `INSERT OR IGNORE INTO motorsport_sent_pings
        (series, event_id, session_id, channel_id, message_id, delete_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [p.series, p.eventId, p.sessionId, p.channelId, p.messageId, p.deleteAt],
    );
  }

  dueDeletes(now: number): DuePing[] {
    return this.db
      .query<DueRow, [number]>(
        `SELECT series, event_id, session_id, channel_id, message_id FROM motorsport_sent_pings
         WHERE message_id IS NOT NULL AND delete_at <= ?`,
      )
      .all(now)
      .map((row) => ({
        series: toSeriesKey(row.series),
        eventId: row.event_id,
        sessionId: row.session_id,
        channelId: row.channel_id,
        messageId: row.message_id,
      }));
  }

  markDeleted(s: SeriesKey, eventId: string, sessionId: string): void {
    this.db.run(
      "UPDATE motorsport_sent_pings SET message_id = NULL WHERE series = ? AND event_id = ? AND session_id = ?",
      [s, eventId, sessionId],
    );
  }
}
