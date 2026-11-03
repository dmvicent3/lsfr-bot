import type { Database } from "bun:sqlite";
import type { DateRange } from "../../../core/types.ts";
import type { Game, GameKey } from "../types.ts";
import { COLUMNS, KEY, MARKS, SOLVED, toGame, values } from "./rows.ts";
import type { GameRow } from "./types.ts";

/** sudoku_games: one row per player, kind, date and slot. */
export class GameStore {
  constructor(private readonly db: Database) {}

  get(k: GameKey): Game | null {
    const row = this.db
      .query<GameRow, string[]>(`SELECT * FROM sudoku_games WHERE ${KEY}`)
      .get(k.guildId, k.userId, k.kind, k.date, k.slot);

    return row ? toGame(row) : null;
  }

  /** The stored game: `g` if the slot was free, else the one already there. */
  start(g: Game): Game {
    this.db
      .query(`INSERT OR IGNORE INTO sudoku_games (${COLUMNS}) VALUES (${MARKS})`)
      .run(...values(g));

    return this.get(g) ?? g;
  }

  /** Overwrites the slot, for the one-per-player practice game. */
  replace(g: Game): Game {
    this.db
      .query(`INSERT OR REPLACE INTO sudoku_games (${COLUMNS}) VALUES (${MARKS})`)
      .run(...values(g));

    return g;
  }

  /** Stores an unsolved game's progress; false when the game was already solved. */
  save(g: Game): boolean {
    const { changes } = this.db
      .query(
        `UPDATE sudoku_games
         SET cells = ?, wrong = ?, cursor = ?, checks = ?, solved_at = ?, points = ?, streak = ?,
             notes = ?, note_mode = ?
         WHERE ${KEY} AND solved_at IS NULL`,
      )
      .run(
        g.cells,
        g.wrong,
        g.cursor,
        g.checks,
        g.solvedAt,
        g.points,
        g.streak,
        g.notes,
        g.noteMode ? 1 : 0,
        g.guildId,
        g.userId,
        g.kind,
        g.date,
        g.slot,
      );

    return changes === 1;
  }

  solvedIn(guildId: string, range: DateRange): Game[] {
    return this.db
      .query<GameRow, [string, string, string]>(`${SOLVED} AND date BETWEEN ? AND ?`)
      .all(guildId, range.from, range.to)
      .map(toGame);
  }

  solvedBy(guildId: string, userId: string): Game[] {
    return this.db
      .query<GameRow, [string, string]>(`${SOLVED} AND user_id = ? ORDER BY date, solved_at`)
      .all(guildId, userId)
      .map(toGame);
  }

  solvedOn(guildId: string, userId: string, date: string): Game[] {
    return this.db
      .query<GameRow, [string, string, string]>(`${SOLVED} AND user_id = ? AND date = ?`)
      .all(guildId, userId, date)
      .map(toGame);
  }

  lastSolvedBefore(guildId: string, userId: string, date: string): Game | null {
    const row = this.db
      .query<GameRow, [string, string, string]>(
        `${SOLVED} AND user_id = ? AND date < ? ORDER BY date DESC, solved_at DESC LIMIT 1`,
      )
      .get(guildId, userId, date);

    return row ? toGame(row) : null;
  }
}
