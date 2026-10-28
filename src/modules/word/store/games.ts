import type { Database } from "bun:sqlite";
import type { DateRange, Game, LastGame } from "../types.ts";
import type { GameRow } from "./types.ts";

const toGame = (r: GameRow): Game => ({
  guildId: r.guild_id,
  date: r.date,
  userId: r.user_id,
  guesses: r.guesses === "" ? [] : r.guesses.split(","),
  won: r.won === null ? null : r.won === 1,
  points: r.points,
  streak: r.streak,
  finishedAt: r.finished_at,
});

const FINISHED = "SELECT * FROM word_games WHERE guild_id = ? AND finished_at IS NOT NULL";
const OPEN_ROW =
  "INSERT OR IGNORE INTO word_games (guild_id, date, user_id, guesses) VALUES (?, ?, ?, ?)";

/** word_games: one row per server, date and player. */
export class GameStore {
  constructor(private readonly db: Database) {}

  get(guildId: string, date: string, userId: string): Game | null {
    const row = this.db
      .query<GameRow, [string, string, string]>(
        "SELECT * FROM word_games WHERE guild_id = ? AND date = ? AND user_id = ?",
      )
      .get(guildId, date, userId);

    return row ? toGame(row) : null;
  }

  /** Stores an open game's guesses; a finished game is never touched. */
  saveGuesses(g: Game): void {
    this.db.query(OPEN_ROW).run(g.guildId, g.date, g.userId, "");
    this.db
      .query(
        `UPDATE word_games SET guesses = ?
         WHERE guild_id = ? AND date = ? AND user_id = ? AND finished_at IS NULL`,
      )
      .run(g.guesses.join(","), g.guildId, g.date, g.userId);
  }

  /** Finishes an open game; false when it was already finished, so points land once. */
  finish(g: Game): boolean {
    this.db.query(OPEN_ROW).run(g.guildId, g.date, g.userId, "");
    const { changes } = this.db
      .query(
        `UPDATE word_games SET guesses = ?, won = ?, points = ?, streak = ?, finished_at = ?
         WHERE guild_id = ? AND date = ? AND user_id = ? AND finished_at IS NULL`,
      )
      .run(
        g.guesses.join(","),
        g.won ? 1 : 0,
        g.points,
        g.streak,
        g.finishedAt,
        g.guildId,
        g.date,
        g.userId,
      );

    return changes === 1;
  }

  lastFinished(guildId: string, userId: string, before: string): LastGame | null {
    const row = this.db
      .query<GameRow, [string, string, string]>(
        `${FINISHED} AND user_id = ? AND date < ? ORDER BY date DESC LIMIT 1`,
      )
      .get(guildId, userId, before);

    return row ? { date: row.date, won: row.won === 1, streak: row.streak ?? 0 } : null;
  }

  finishedIn(guildId: string, range: DateRange): Game[] {
    return this.db
      .query<GameRow, [string, string, string]>(`${FINISHED} AND date BETWEEN ? AND ?`)
      .all(guildId, range.from, range.to)
      .map(toGame);
  }

  finishedBy(guildId: string, userId: string): Game[] {
    return this.db
      .query<GameRow, [string, string]>(`${FINISHED} AND user_id = ? ORDER BY date`)
      .all(guildId, userId)
      .map(toGame);
  }
}
