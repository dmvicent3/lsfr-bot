import type { SeriesKey } from "../types.ts";
import type { Database } from "bun:sqlite";

/** motorsport_threads: each weekend's results thread. */
export class ThreadStore {
  constructor(private readonly db: Database) {}

  /** The weekend's results thread. */
  get(s: SeriesKey, eventId: string): string | null {
    const row = this.db
      .query<{ thread_id: string }, [string, string]>(
        "SELECT thread_id FROM motorsport_threads WHERE series = ? AND event_id = ?",
      )
      .get(s, eventId);
    return row?.thread_id ?? null;
  }

  set(s: SeriesKey, eventId: string, threadId: string): void {
    this.db.run(
      "INSERT OR REPLACE INTO motorsport_threads (series, event_id, thread_id) VALUES (?, ?, ?)",
      [s, eventId, threadId],
    );
  }
}
