import type { Database } from "bun:sqlite";
import type { PlayerStats, ScoreRow, Standing } from "./types.ts";

const INSERT = `INSERT INTO trivia_scores (guild_id, user_id, session_id, kind, item_id, points, ms, at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

const IN_RANGE = "guild_id = ? AND at >= ? AND at < ?";

/** trivia_scores: one row per point award; every total comes from here. */
export class ScoreStore {
  constructor(private readonly db: Database) {}

  add(rows: ScoreRow[]): void {
    const insert = this.db.query(INSERT);
    this.db.transaction(() => {
      for (const r of rows) {
        insert.run(r.guildId, r.userId, r.sessionId, r.kind, r.itemId, r.points, r.ms, r.at);
      }
    })();
  }

  /** Points per player from `from` up to (not including) `to`; most first, ties by user ID. */
  standings(guildId: string, from: number, to: number): Standing[] {
    return this.db
      .query<{ userId: string; points: number }, [string, number, number]>(
        `SELECT user_id AS userId, SUM(points) AS points FROM trivia_scores
         WHERE ${IN_RANGE} GROUP BY user_id ORDER BY points DESC, user_id`,
      )
      .all(guildId, from, to);
  }

  stats(guildId: string, userId: string, from: number, to: number): PlayerStats {
    const row = this.db
      .query<PlayerStats, [string, number, number, string]>(
        `SELECT COALESCE(SUM(points), 0) AS points,
           COUNT(CASE WHEN kind = 'typed' THEN 1 END) AS typedWins,
           AVG(CASE WHEN kind = 'typed' THEN ms END) AS avgTypedMs,
           MIN(CASE WHEN kind = 'typed' THEN ms END) AS bestTypedMs,
           COUNT(CASE WHEN kind = 'kaos' THEN 1 END) AS kaosItems
         FROM trivia_scores WHERE ${IN_RANGE} AND user_id = ?`,
      )
      .get(guildId, from, to, userId);

    return row ?? { points: 0, typedWins: 0, avgTypedMs: null, bestTypedMs: null, kaosItems: 0 };
  }
}
