import type { SessionRow } from "./types.ts";
import type { SeriesKey, Session } from "../types.ts";
import { toSeriesKey } from "../series.ts";
import type { Database } from "bun:sqlite";

/** motorsport_sessions: each series' schedule, replaced whole on every refresh. */
export class SessionStore {
  constructor(private readonly db: Database) {}

  replace(s: SeriesKey, sessions: Session[], fetchedAt: number): void {
    const insert = this.db.prepare(
      `INSERT OR REPLACE INTO motorsport_sessions
        (series, event_id, event_name, session_id, title, start, end, pingable, fetched_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    this.db.transaction(() => {
      this.db.run("DELETE FROM motorsport_sessions WHERE series = ?", [s]);
      for (const x of sessions) {
        insert.run(
          s,
          x.eventId,
          x.eventName,
          x.sessionId,
          x.title,
          x.start.getTime(),
          x.end.getTime(),
          x.pingable ? 1 : 0,
          fetchedAt,
        );
      }
    })();
  }

  list(s: SeriesKey): Session[] {
    return this.db
      .query<SessionRow, [string]>(
        "SELECT * FROM motorsport_sessions WHERE series = ? ORDER BY start, session_id",
      )
      .all(s)
      .map((row) => ({
        series: toSeriesKey(row.series),
        eventId: row.event_id,
        eventName: row.event_name,
        sessionId: row.session_id,
        title: row.title,
        start: new Date(row.start),
        end: new Date(row.end),
        pingable: row.pingable === 1,
      }));
  }
}
