import type { SeriesKey } from "../types.ts";
import type { RulingMark } from "../rulings/types.ts";
import type { Database } from "bun:sqlite";

/** motorsport_rulings: FIA documents already dealt with. */
export class RulingStore {
  constructor(private readonly db: Database) {}

  /** A ruling document dealt with: posted, or looked at and not for posting. */
  mark(s: SeriesKey, { eventId, url, posted, now }: RulingMark): void {
    this.db.run(
      `INSERT OR REPLACE INTO motorsport_rulings (url, series, event_id, posted, handled_at)
       VALUES (?, ?, ?, ?, ?)`,
      [url, s, eventId, posted ? 1 : 0, now],
    );
  }

  handled(s: SeriesKey): Set<string> {
    const rows = this.db
      .query<{ url: string }, [string]>("SELECT url FROM motorsport_rulings WHERE series = ?")
      .all(s);

    return new Set(rows.map((r) => r.url));
  }
}
