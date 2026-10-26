import type { PicksRow } from "./types.ts";
import type { SeriesKey, SessionRef, Viewer } from "../types.ts";
import type { Picks, Prediction, SeasonEntry } from "../predictions/types.ts";
import { parseResultRows } from "../results/results.ts";
import type { Database } from "bun:sqlite";

const picksOf = (r: PicksRow): Picks => [r.p1, r.p2, r.p3];

const COMPLETE = "p1 IS NOT NULL AND p2 IS NOT NULL AND p3 IS NOT NULL";

/** motorsport_predictions: each user's podium picks per race and sprint. */
export class PredictionStore {
  constructor(private readonly db: Database) {}

  get(userId: string, s: SeriesKey, eventId: string, sessionId: string): Picks {
    const row = this.db
      .query<PicksRow, [string, string, string, string]>(
        `SELECT user_id, p1, p2, p3 FROM motorsport_predictions
         WHERE series = ? AND event_id = ? AND session_id = ? AND user_id = ?`,
      )
      .get(s, eventId, sessionId, userId);

    return row ? picksOf(row) : [null, null, null];
  }

  set({ userId, now }: Viewer, { series: s, eventId, sessionId }: SessionRef, picks: Picks): void {
    this.db.run(
      `INSERT OR REPLACE INTO motorsport_predictions
        (series, event_id, session_id, user_id, p1, p2, p3, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [s, eventId, sessionId, userId, ...picks, now],
    );
  }

  /** Predictions with all three positions picked. */
  complete(s: SeriesKey, eventId: string, sessionId: string): Prediction[] {
    return this.db
      .query<PicksRow & { p1: string; p2: string; p3: string }, [string, string, string]>(
        `SELECT user_id, p1, p2, p3 FROM motorsport_predictions
         WHERE series = ? AND event_id = ? AND session_id = ? AND ${COMPLETE}
         ORDER BY updated_at`,
      )
      .all(s, eventId, sessionId)
      .map((r) => ({ userId: r.user_id, picks: [r.p1, r.p2, r.p3] }));
  }

  /** Complete predictions per session of one event. */
  counts(s: SeriesKey, eventId: string): Map<string, number> {
    const rows = this.db
      .query<{ session_id: string; n: number }, [string, string]>(
        `SELECT session_id, COUNT(*) AS n FROM motorsport_predictions
         WHERE series = ? AND event_id = ? AND ${COMPLETE} GROUP BY session_id`,
      )
      .all(s, eventId);

    return new Map(rows.map((r) => [r.session_id, r.n]));
  }

  /** Every complete race/sprint prediction whose result was posted at or after `since`. */
  season(s: SeriesKey, since: number): SeasonEntry[] {
    return this.db
      .query<
        { user_id: string; p1: string; p2: string; p3: string; rows_json: string },
        [string, number]
      >(
        `SELECT p.user_id, p.p1, p.p2, p.p3, r.rows_json
         FROM motorsport_predictions p
         JOIN motorsport_results r USING (series, event_id, session_id)
         WHERE p.series = ? AND r.posted_at >= ? AND r.kind IN ('race', 'sprint')
           AND ${COMPLETE}
         ORDER BY r.posted_at, p.user_id`,
      )
      .all(s, since)
      .map((r) => ({
        userId: r.user_id,
        picks: [r.p1, r.p2, r.p3],
        rows: parseResultRows(r.rows_json),
      }));
  }
}
