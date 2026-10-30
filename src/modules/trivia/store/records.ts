import type { Database } from "bun:sqlite";
import type { SpeedRecord } from "./types.ts";

/** trivia_records: the fastest typed answer per server and question. */
export class RecordStore {
  constructor(private readonly db: Database) {}

  get(guildId: string, questionId: number): SpeedRecord | null {
    return (
      this.db
        .query<SpeedRecord, [string, number]>(
          `SELECT guild_id AS guildId, question_id AS questionId, user_id AS userId, ms, at
           FROM trivia_records WHERE guild_id = ? AND question_id = ?`,
        )
        .get(guildId, questionId) ?? null
    );
  }

  /** Keeps `r` when it beats the record (or there is none); returns the record it was measured against. */
  offer(r: SpeedRecord): { previous: SpeedRecord | null; improved: boolean } {
    const previous = this.get(r.guildId, r.questionId);
    const improved = previous === null || r.ms < previous.ms;

    if (improved) {
      this.db
        .query(
          `INSERT OR REPLACE INTO trivia_records (guild_id, question_id, user_id, ms, at)
           VALUES (?, ?, ?, ?, ?)`,
        )
        .run(r.guildId, r.questionId, r.userId, r.ms, r.at);
    }

    return { previous, improved };
  }
}
