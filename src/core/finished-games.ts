import type { Database } from "bun:sqlite";
import type { DateRange } from "./types.ts";

/**
 * The finished-game queries every daily store shares. `table` must be a code constant with
 * guild_id, date, user_id and finished_at columns, never user input.
 */
export class FinishedGames<R, G> {
  private readonly base: string;

  constructor(
    private readonly db: Database,
    table: string,
    private readonly toGame: (row: R) => G,
  ) {
    this.base = `SELECT * FROM ${table} WHERE guild_id = ? AND finished_at IS NOT NULL`;
  }

  in(guildId: string, range: DateRange): G[] {
    return this.db
      .query<R, [string, string, string]>(`${this.base} AND date BETWEEN ? AND ?`)
      .all(guildId, range.from, range.to)
      .map(this.toGame);
  }

  by(guildId: string, userId: string): G[] {
    return this.db
      .query<R, [string, string]>(`${this.base} AND user_id = ? ORDER BY date`)
      .all(guildId, userId)
      .map(this.toGame);
  }

  lastBefore(guildId: string, userId: string, date: string): G | null {
    const row = this.db
      .query<R, [string, string, string]>(
        `${this.base} AND user_id = ? AND date < ? ORDER BY date DESC LIMIT 1`,
      )
      .get(guildId, userId, date);

    return row ? this.toGame(row) : null;
  }
}
