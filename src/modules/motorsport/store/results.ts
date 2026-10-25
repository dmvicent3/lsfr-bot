import type { SeriesKey, StoredResult } from "../types.ts";
import { parseResultRows } from "../results/results.ts";
import type { ResultKind } from "../results/types.ts";
import type { Database } from "bun:sqlite";

/** motorsport_results: every posted classification. */
export class ResultStore {
  constructor(private readonly db: Database) {}

  insert(r: StoredResult): void {
    this.db.run(
      `INSERT OR REPLACE INTO motorsport_results
        (series, event_id, event_name, session_id, kind, rows_json, posted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [r.series, r.eventId, r.eventName, r.sessionId, r.kind, JSON.stringify(r.rows), r.postedAt],
    );
  }

  /** `eventId/sessionId` of every stored result. */
  keys(s: SeriesKey): Set<string> {
    const rows = this.db
      .query<{ key: string }, [string]>(
        "SELECT event_id || '/' || session_id AS key FROM motorsport_results WHERE series = ?",
      )
      .all(s);
    return new Set(rows.map((r) => r.key));
  }

  latest(s: SeriesKey): StoredResult | null {
    const row = this.db
      .query<
        {
          event_id: string;
          event_name: string;
          session_id: string;
          kind: ResultKind;
          rows_json: string;
          posted_at: number;
        },
        [string]
      >(
        `SELECT event_id, event_name, session_id, kind, rows_json, posted_at
         FROM motorsport_results WHERE series = ? ORDER BY posted_at DESC LIMIT 1`,
      )
      .get(s);
    if (!row) return null;
    return {
      series: s,
      eventId: row.event_id,
      eventName: row.event_name,
      sessionId: row.session_id,
      kind: row.kind,
      rows: parseResultRows(row.rows_json),
      postedAt: row.posted_at,
    };
  }
}
