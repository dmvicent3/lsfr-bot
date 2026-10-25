import type { SeriesKey } from "../types.ts";
import type { Database } from "bun:sqlite";

/** motorsport_one_off: per-user reminders for single sessions. */
export class ReminderStore {
  constructor(private readonly db: Database) {}

  /** Returns true when the reminder is now set, false when it was removed. */
  toggle(userId: string, s: SeriesKey, eventId: string, sessionId: string): boolean {
    const params = [userId, s, eventId, sessionId];
    const removed = this.db.run(
      "DELETE FROM motorsport_one_off WHERE user_id = ? AND series = ? AND event_id = ? AND session_id = ?",
      params,
    );
    if (removed.changes > 0) return false;
    this.db.run(
      "INSERT INTO motorsport_one_off (user_id, series, event_id, session_id) VALUES (?, ?, ?, ?)",
      params,
    );
    return true;
  }

  users(s: SeriesKey, eventId: string, sessionId: string): string[] {
    return this.db
      .query<{ user_id: string }, [string, string, string]>(
        "SELECT user_id FROM motorsport_one_off WHERE series = ? AND event_id = ? AND session_id = ? ORDER BY user_id",
      )
      .all(s, eventId, sessionId)
      .map((row) => row.user_id);
  }

  ofUser(userId: string, s: SeriesKey, eventId: string): string[] {
    return this.db
      .query<{ session_id: string }, [string, string, string]>(
        "SELECT session_id FROM motorsport_one_off WHERE user_id = ? AND series = ? AND event_id = ? ORDER BY session_id",
      )
      .all(userId, s, eventId)
      .map((row) => row.session_id);
  }

  /** Replaces the user's one-off reminders for one event with exactly `sessionIds`. */
  set(userId: string, s: SeriesKey, eventId: string, sessionIds: string[]): void {
    this.db.transaction(() => {
      this.db.run(
        "DELETE FROM motorsport_one_off WHERE user_id = ? AND series = ? AND event_id = ?",
        [userId, s, eventId],
      );
      for (const sessionId of sessionIds) {
        this.db.run(
          "INSERT INTO motorsport_one_off (user_id, series, event_id, session_id) VALUES (?, ?, ?, ?)",
          [userId, s, eventId, sessionId],
        );
      }
    })();
  }

  clear(s: SeriesKey, eventId: string, sessionId: string): void {
    this.db.run(
      "DELETE FROM motorsport_one_off WHERE series = ? AND event_id = ? AND session_id = ?",
      [s, eventId, sessionId],
    );
  }
}
