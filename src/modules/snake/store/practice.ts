import type { Database } from "bun:sqlite";
import type { Practice } from "../types.ts";
import { guessesText, toPractice } from "./rows.ts";
import type { PracticeRow } from "./types.ts";

/** snake_practice: one round per player, kept until they start a new one. */
export class PracticeStore {
  constructor(private readonly db: Database) {}

  get(guildId: string, userId: string): Practice | null {
    const row = this.db
      .query<PracticeRow, [string, string]>(
        "SELECT * FROM snake_practice WHERE guild_id = ? AND user_id = ?",
      )
      .get(guildId, userId);

    return row ? toPractice(row) : null;
  }

  /** Starts a new round, dropping the previous one. */
  replace(p: Practice): void {
    this.db
      .query(
        `INSERT OR REPLACE INTO snake_practice
         (guild_id, user_id, answer, guesses, started_at, finished_at) VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(p.guildId, p.userId, p.answer, guessesText(p.guesses), p.startedAt, p.finishedAt);
  }

  /** Stores a round's guesses and finish time; false when it was already finished. */
  save(p: Practice): boolean {
    const { changes } = this.db
      .query(
        `UPDATE snake_practice SET guesses = ?, finished_at = ?
         WHERE guild_id = ? AND user_id = ? AND finished_at IS NULL`,
      )
      .run(guessesText(p.guesses), p.finishedAt, p.guildId, p.userId);

    return changes === 1;
  }
}
