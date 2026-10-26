import type { Database } from "bun:sqlite";
import type { Checked, Series, SeriesRow } from "./types.ts";

export const toSeries = (r: SeriesRow): Series => ({
  id: r.id,
  title: r.title,
  highest: r.highest,
  latestUpload: r.latest_upload,
  checkedAt: r.checked_at,
});

/** manga_series: every manga someone followed, with what the poll has seen of it. */
export class SeriesStore {
  constructor(private readonly db: Database) {}

  /** Inserts the series unless it exists; false when it did. */
  add(s: Series): boolean {
    return (
      this.db.run(
        `INSERT OR IGNORE INTO manga_series (id, title, highest, latest_upload, checked_at)
         VALUES (?, ?, ?, ?, ?)`,
        [s.id, s.title, s.highest, s.latestUpload, s.checkedAt],
      ).changes > 0
    );
  }

  get(id: string): Series | null {
    const row = this.db
      .query<SeriesRow, [string]>("SELECT * FROM manga_series WHERE id = ?")
      .get(id);

    return row ? toSeries(row) : null;
  }

  /** Series with at least one follower, by title. */
  followed(): Series[] {
    return this.db
      .query<SeriesRow, []>(
        `SELECT * FROM manga_series s
         WHERE EXISTS (SELECT 1 FROM manga_follows f WHERE f.manga_id = s.id)
         ORDER BY s.title, s.id`,
      )
      .all()
      .map(toSeries);
  }

  setHighest(id: string, highest: number): void {
    this.db.run("UPDATE manga_series SET highest = ? WHERE id = ?", [highest, id]);
  }

  markChecked(id: string, c: Checked): void {
    this.db.run(
      "UPDATE manga_series SET title = ?, latest_upload = ?, checked_at = ? WHERE id = ?",
      [c.title, c.latestUpload, c.checkedAt, id],
    );
  }
}
