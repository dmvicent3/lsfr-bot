import type { Database } from "bun:sqlite";
import { FinishedGames } from "../../../core/finished-games.ts";
import type { LastGame } from "../../../core/daily.ts";
import type { Mode, MultiGame } from "../multi/types.ts";
import type { DateRange } from "../types.ts";
import { toGame, toLast } from "./games.ts";
import type { MultiGameRow } from "./types.ts";

/** Which game: the server, mode, date and player. */
export type MultiKey = Pick<MultiGame, "guildId" | "mode" | "date" | "userId">;

const KEY = "guild_id = ? AND mode = ? AND date = ? AND user_id = ?";
const OPEN_ROW =
  "INSERT OR IGNORE INTO word_multi_games (guild_id, mode, date, user_id, guesses) VALUES (?, ?, ?, ?, '')";

const keyOf = (k: MultiKey) => [k.guildId, k.mode, k.date, k.userId] as const;

const toMulti =
  (mode: Mode) =>
  (r: MultiGameRow): MultiGame => ({ ...toGame(r), mode, found: r.found });

/** Each mode's finished-game queries; the filter's mode is a code constant. */
function finishedOf<G>(
  db: Database,
  map: (mode: Mode) => (r: MultiGameRow) => G,
): Record<Mode, FinishedGames<MultiGameRow, G>> {
  const make = (m: Mode) => new FinishedGames(db, "word_multi_games", map(m), `mode = '${m}'`);

  return { duo: make("duo"), quad: make("quad") };
}

/** word_multi_games: one row per server, mode, date and player. */
export class MultiGameStore {
  private readonly last: Record<Mode, FinishedGames<MultiGameRow, LastGame>>;
  private readonly finished: Record<Mode, FinishedGames<MultiGameRow, MultiGame>>;

  constructor(private readonly db: Database) {
    this.last = finishedOf(db, () => toLast);
    this.finished = finishedOf(db, toMulti);
  }

  get(k: MultiKey): MultiGame | null {
    const row = this.db
      .query<MultiGameRow, [string, string, string, string]>(
        `SELECT * FROM word_multi_games WHERE ${KEY}`,
      )
      .get(...keyOf(k));

    return row ? toMulti(k.mode)(row) : null;
  }

  /** Stores an open game's guesses; a finished game is never touched. */
  saveGuesses(g: MultiGame): void {
    this.db.query(OPEN_ROW).run(...keyOf(g));
    this.db
      .query(`UPDATE word_multi_games SET guesses = ? WHERE ${KEY} AND finished_at IS NULL`)
      .run(g.guesses.join(","), ...keyOf(g));
  }

  /** Finishes an open game; false when it was already finished, so points land once. */
  finish(g: MultiGame): boolean {
    this.db.query(OPEN_ROW).run(...keyOf(g));
    const { changes } = this.db
      .query(
        `UPDATE word_multi_games SET guesses = ?, won = ?, found = ?, points = ?, streak = ?,
         finished_at = ? WHERE ${KEY} AND finished_at IS NULL`,
      )
      .run(
        g.guesses.join(","),
        g.won ? 1 : 0,
        g.found,
        g.points,
        g.streak,
        g.finishedAt,
        ...keyOf(g),
      );

    return changes === 1;
  }

  lastFinished(k: MultiKey): LastGame | null {
    return this.last[k.mode].lastBefore(k.guildId, k.userId, k.date);
  }

  finishedIn(mode: Mode, guildId: string, range: DateRange): MultiGame[] {
    return this.finished[mode].in(guildId, range);
  }

  finishedBy(mode: Mode, guildId: string, userId: string): MultiGame[] {
    return this.finished[mode].by(guildId, userId);
  }
}
