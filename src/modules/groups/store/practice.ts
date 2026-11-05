import type { Database } from "bun:sqlite";
import type { Practice } from "../types.ts";
import { PROGRESS, SET_PROGRESS, progressValues, toPractice } from "./rows.ts";
import type { PracticeRow } from "./types.ts";

/** groups_practice: one round per player, kept until they start a new one. */
export class PracticeStore {
  constructor(private readonly db: Database) {}

  get(guildId: string, userId: string): Practice | null {
    const row = this.db
      .query<PracticeRow, [string, string]>(
        "SELECT * FROM groups_practice WHERE guild_id = ? AND user_id = ?",
      )
      .get(guildId, userId);

    return row ? toPractice(row) : null;
  }

  /** Starts a new round, dropping the previous one. */
  replace(p: Practice): void {
    this.db
      .query(
        `INSERT OR REPLACE INTO groups_practice
         (guild_id, user_id, puzzle, ${PROGRESS}, started_at, finished_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        p.guildId,
        p.userId,
        JSON.stringify(p.puzzle),
        ...progressValues(p),
        p.startedAt,
        p.finishedAt,
      );
  }

  /** Stores a round's progress and finish time; false when it was already finished. */
  save(p: Practice): boolean {
    const { changes } = this.db
      .query(
        `UPDATE groups_practice SET ${SET_PROGRESS}, finished_at = ?
         WHERE guild_id = ? AND user_id = ? AND finished_at IS NULL`,
      )
      .run(...progressValues(p), p.finishedAt, p.guildId, p.userId);

    return changes === 1;
  }
}
