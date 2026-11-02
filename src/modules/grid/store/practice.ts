import type { Database } from "bun:sqlite";
import type { Practice } from "../types.ts";
import { gridJson, type PracticeRow, toPractice } from "./rows.ts";

/** grid_practice: one round per player, kept until they start a new one. */
export class PracticeStore {
  constructor(private readonly db: Database) {}

  get(guildId: string, userId: string): Practice | null {
    const row = this.db
      .query<PracticeRow, [string, string]>(
        "SELECT * FROM grid_practice WHERE guild_id = ? AND user_id = ?",
      )
      .get(guildId, userId);

    return row ? toPractice(row) : null;
  }

  /** Starts a new round, dropping the previous one. */
  replace(p: Practice): void {
    this.db
      .query(
        `INSERT OR REPLACE INTO grid_practice
         (guild_id, user_id, rows, cols, answers, cells, guesses, last_miss, points,
          started_at, finished_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        p.guildId,
        p.userId,
        ...gridJson(p.grid),
        JSON.stringify(p.cells),
        p.guesses,
        p.lastMiss,
        p.points,
        p.startedAt,
        p.finishedAt,
      );
  }

  /** Stores a round's progress; false when it was already finished. */
  save(p: Practice): boolean {
    const { changes } = this.db
      .query(
        `UPDATE grid_practice
         SET cells = ?, guesses = ?, last_miss = ?, points = ?, finished_at = ?
         WHERE guild_id = ? AND user_id = ? AND finished_at IS NULL`,
      )
      .run(
        JSON.stringify(p.cells),
        p.guesses,
        p.lastMiss,
        p.points,
        p.finishedAt,
        p.guildId,
        p.userId,
      );

    return changes === 1;
  }
}
