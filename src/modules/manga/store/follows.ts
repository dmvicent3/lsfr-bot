import type { Database } from "bun:sqlite";
import { toSeries } from "./series.ts";
import type { Series, SeriesRow } from "./types.ts";

/** manga_follows: which member follows which manga. */
export class FollowStore {
  constructor(private readonly db: Database) {}

  /** False when the member already follows it. */
  add(mangaId: string, userId: string): boolean {
    return (
      this.db.run("INSERT OR IGNORE INTO manga_follows (manga_id, user_id) VALUES (?, ?)", [
        mangaId,
        userId,
      ]).changes > 0
    );
  }

  /** False when the member didn't follow it. */
  remove(mangaId: string, userId: string): boolean {
    return (
      this.db.run("DELETE FROM manga_follows WHERE manga_id = ? AND user_id = ?", [mangaId, userId])
        .changes > 0
    );
  }

  followers(mangaId: string): string[] {
    return this.db
      .query<{ user_id: string }, [string]>(
        "SELECT user_id FROM manga_follows WHERE manga_id = ? ORDER BY user_id",
      )
      .all(mangaId)
      .map((r) => r.user_id);
  }

  /** The member's followed series, by title. */
  byUser(userId: string): Series[] {
    return this.db
      .query<SeriesRow, [string]>(
        `SELECT s.* FROM manga_series s JOIN manga_follows f ON f.manga_id = s.id
         WHERE f.user_id = ? ORDER BY s.title, s.id`,
      )
      .all(userId)
      .map(toSeries);
  }

  count(userId: string): number {
    return (
      this.db
        .query<{ n: number }, [string]>("SELECT COUNT(*) AS n FROM manga_follows WHERE user_id = ?")
        .get(userId)?.n ?? 0
    );
  }
}
