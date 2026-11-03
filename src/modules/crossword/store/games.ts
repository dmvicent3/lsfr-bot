import type { Database } from "bun:sqlite";
import { FinishedGames } from "../../../core/finished-games.ts";
import type { DateRange } from "../../../core/types.ts";
import type { Game } from "../types.ts";
import { COLUMNS, type GameRow, KEY, MARKS, solvedFlag, toGame, values } from "./rows.ts";

/** crossword_games: one row per player and date. */
export class GameStore {
  private readonly finished: FinishedGames<GameRow, Game>;

  constructor(private readonly db: Database) {
    this.finished = new FinishedGames<GameRow, Game>(db, "crossword_games", toGame);
  }

  get(guildId: string, date: string, userId: string): Game | null {
    const row = this.db
      .query<GameRow, string[]>(`SELECT * FROM crossword_games WHERE ${KEY}`)
      .get(guildId, date, userId);

    return row ? toGame(row) : null;
  }

  /** The stored game: `g` if the slot was free, else the one already there. */
  start(g: Game): Game {
    this.db
      .query(`INSERT OR IGNORE INTO crossword_games (${COLUMNS}) VALUES (${MARKS})`)
      .run(...values(g));

    return this.get(g.guildId, g.date, g.userId) ?? g;
  }

  /** Stores a game progress; false when it was already finished. */
  save(g: Game): boolean {
    const { changes } = this.db
      .query(
        `UPDATE crossword_games SET cells = ?, wrong = ?, reveals = ?, last_line = ?
         WHERE ${KEY} AND finished_at IS NULL`,
      )
      .run(g.cells, g.wrong, g.reveals, g.lastLine, g.guildId, g.date, g.userId);

    return changes === 1;
  }

  /** The finishing write, one statement; false when the game was already finished. */
  finish(g: Game): boolean {
    const { changes } = this.db
      .query(
        `UPDATE crossword_games
         SET cells = ?, wrong = ?, reveals = ?, last_line = ?, solved = ?, points = ?,
             streak = ?, finished_at = ?
         WHERE ${KEY} AND finished_at IS NULL`,
      )
      .run(
        g.cells,
        g.wrong,
        g.reveals,
        g.lastLine,
        solvedFlag(g.solved),
        g.points,
        g.streak,
        g.finishedAt,
        g.guildId,
        g.date,
        g.userId,
      );

    return changes === 1;
  }

  finishedIn(guildId: string, range: DateRange): Game[] {
    return this.finished.in(guildId, range);
  }

  finishedBy(guildId: string, userId: string): Game[] {
    return this.finished.by(guildId, userId);
  }

  lastFinishedBefore(guildId: string, userId: string, date: string): Game | null {
    return this.finished.lastBefore(guildId, userId, date);
  }
}
