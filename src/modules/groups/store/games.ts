import type { Database } from "bun:sqlite";
import { FinishedGames } from "../../../core/finished-games.ts";
import type { DateRange } from "../../../core/types.ts";
import type { Game } from "../types.ts";
import { PROGRESS, SET_PROGRESS, progressValues, solvedFlag, toGame } from "./rows.ts";
import type { GameRow } from "./types.ts";

const KEY = "guild_id = ? AND date = ? AND user_id = ?";
const keyOf = (g: Game) => [g.guildId, g.date, g.userId];

/** groups_games: one row per player and date. */
export class GameStore {
  private readonly finished: FinishedGames<GameRow, Game>;

  constructor(private readonly db: Database) {
    this.finished = new FinishedGames<GameRow, Game>(db, "groups_games", toGame);
  }

  get(guildId: string, date: string, userId: string): Game | null {
    const row = this.db
      .query<GameRow, string[]>(`SELECT * FROM groups_games WHERE ${KEY}`)
      .get(guildId, date, userId);

    return row ? toGame(row) : null;
  }

  /** The stored game: `g` if the slot was free, else the one already there. */
  start(g: Game): Game {
    this.db
      .query(
        `INSERT OR IGNORE INTO groups_games (guild_id, date, user_id, ${PROGRESS}, started_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(...keyOf(g), ...progressValues(g), g.startedAt);

    return this.get(g.guildId, g.date, g.userId) ?? g;
  }

  /** Stores a game's progress; false when it was already finished. */
  save(g: Game): boolean {
    const { changes } = this.db
      .query(`UPDATE groups_games SET ${SET_PROGRESS} WHERE ${KEY} AND finished_at IS NULL`)
      .run(...progressValues(g), ...keyOf(g));

    return changes === 1;
  }

  /** The finishing write, one statement; false when the game was already finished. */
  finish(g: Game): boolean {
    const { changes } = this.db
      .query(
        `UPDATE groups_games
         SET ${SET_PROGRESS}, solved = ?, points = ?, streak = ?, finished_at = ?
         WHERE ${KEY} AND finished_at IS NULL`,
      )
      .run(
        ...progressValues(g),
        solvedFlag(g.solved),
        g.points,
        g.streak,
        g.finishedAt,
        ...keyOf(g),
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
