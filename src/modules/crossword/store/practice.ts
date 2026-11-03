import type { Database } from "bun:sqlite";
import type { Practice } from "../types.ts";
import { type PracticeRow, storedJson, toPractice } from "./rows.ts";

/** crossword_practice: one round per player, kept until they start a new one. */
export class PracticeStore {
  constructor(private readonly db: Database) {}

  get(guildId: string, userId: string): Practice | null {
    const row = this.db
      .query<PracticeRow, [string, string]>(
        "SELECT * FROM crossword_practice WHERE guild_id = ? AND user_id = ?",
      )
      .get(guildId, userId);

    return row ? toPractice(row) : null;
  }

  /** Starts a new round, dropping the previous one. */
  replace(p: Practice): void {
    this.db
      .query(
        `INSERT OR REPLACE INTO crossword_practice
         (guild_id, user_id, puzzle, clues, cells, wrong, reveals, last_line, started_at,
          finished_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        p.guildId,
        p.userId,
        ...storedJson(p),
        p.cells,
        p.wrong,
        p.reveals,
        p.lastLine,
        p.startedAt,
        p.finishedAt,
      );
  }

  /** Stores a round progress; false when it was already finished. */
  save(p: Practice): boolean {
    const { changes } = this.db
      .query(
        `UPDATE crossword_practice
         SET cells = ?, wrong = ?, reveals = ?, last_line = ?, finished_at = ?
         WHERE guild_id = ? AND user_id = ? AND finished_at IS NULL`,
      )
      .run(p.cells, p.wrong, p.reveals, p.lastLine, p.finishedAt, p.guildId, p.userId);

    return changes === 1;
  }
}
