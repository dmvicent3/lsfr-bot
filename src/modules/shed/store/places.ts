import type { Database } from "bun:sqlite";
import type { PlaceRow } from "../game/points.ts";

export interface ShedStats {
  games: number;
  wins: number;
  averagePlace: number | null;
  points: number;
}

/** shed_places: one row per ranked player per finished game; leaderboards and stats come from here. */
export class PlaceStore {
  constructor(private readonly db: Database) {}

  add(gameId: number, guildId: string, at: number, rows: PlaceRow[]): void {
    const insert = this.db.query(
      "INSERT OR IGNORE INTO shed_places (game_id, guild_id, user_id, place, points, finished_at) VALUES (?, ?, ?, ?, ?, ?)",
    );
    this.db.transaction(() => {
      for (const r of rows) insert.run(gameId, guildId, r.userId, r.place, r.points, at);
    })();
  }

  /** Points per player from `from` up to (not including) `to`; most first, ties by user ID. */
  standings(guildId: string, from: number, to: number): { userId: string; points: number }[] {
    return this.db
      .query<{ userId: string; points: number }, [string, number, number]>(
        `SELECT user_id AS userId, SUM(points) AS points FROM shed_places
         WHERE guild_id = ? AND finished_at >= ? AND finished_at < ?
         GROUP BY user_id ORDER BY points DESC, user_id`,
      )
      .all(guildId, from, to);
  }

  stats(guildId: string, userId: string): ShedStats {
    const row = this.db
      .query<ShedStats, [string, string]>(
        `SELECT COUNT(*) AS games, COALESCE(SUM(place = 1), 0) AS wins,
         AVG(place) AS averagePlace, COALESCE(SUM(points), 0) AS points
         FROM shed_places WHERE guild_id = ? AND user_id = ?`,
      )
      .get(guildId, userId);

    return row ?? { games: 0, wins: 0, averagePlace: null, points: 0 };
  }
}
