import type { Database } from "bun:sqlite";
import type { DateRange } from "../../../core/types.ts";
import type { Game } from "../types.ts";
import { toGame } from "./rows.ts";
import type { GameRow } from "./types.ts";

/** The daily rows of minesweeper_games (kind = 'daily'): one per player and date. */
export class DailyStore {
  constructor(private readonly db: Database) {}

  /** A player's daily on `date`, finished or not. */
  on(guildId: string, playerId: string, date: string): Game | null {
    const row = this.db
      .query<GameRow, [string, string, string]>(
        `SELECT * FROM minesweeper_games
         WHERE guild_id = ? AND player_id = ? AND kind = 'daily' AND date = ?`,
      )
      .get(guildId, playerId, date);

    return row ? toGame(row) : null;
  }

  /** The player's latest finished daily before `date`, for the streak. */
  lastBefore(guildId: string, playerId: string, date: string): Game | null {
    const row = this.db
      .query<GameRow, [string, string, string]>(
        `SELECT * FROM minesweeper_games
         WHERE guild_id = ? AND player_id = ? AND kind = 'daily' AND date < ?
           AND finished_at IS NOT NULL
         ORDER BY date DESC LIMIT 1`,
      )
      .get(guildId, playerId, date);

    return row ? toGame(row) : null;
  }

  /** Every finished daily of the server dated within `range`. */
  inRange(guildId: string, range: DateRange): Game[] {
    return this.db
      .query<GameRow, [string, string, string]>(
        `SELECT * FROM minesweeper_games
         WHERE guild_id = ? AND kind = 'daily' AND finished_at IS NOT NULL
           AND date >= ? AND date <= ?
         ORDER BY date, id`,
      )
      .all(guildId, range.from, range.to)
      .map(toGame);
  }

  /** A player's finished dailies, oldest first. */
  finished(guildId: string, playerId: string): Game[] {
    return this.db
      .query<GameRow, [string, string]>(
        `SELECT * FROM minesweeper_games
         WHERE guild_id = ? AND player_id = ? AND kind = 'daily' AND finished_at IS NOT NULL
         ORDER BY date, id`,
      )
      .all(guildId, playerId)
      .map(toGame);
  }
}
