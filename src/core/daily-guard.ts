import { puzzleNumber, untilNext } from "./daily.ts";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** A `YYYY-MM-DD` daily scope (as opposed to "practice"). */
export const isDateKey = (s: string): boolean => DATE.test(s);

/** A module's daily store: the day's puzzle per server, and each player's game on it. */
export interface DailyStore<P, G> {
  puzzles: { get(guildId: string, date: string): P | null };
  games: { get(guildId: string, date: string, userId: string): G | null };
}

/** The day's puzzle and the player's own game; null for a bad date or when either is missing. */
export function dailyLookup<P, G>(
  repo: DailyStore<P, G>,
  guildId: string,
  date: string,
  userId: string,
): { puzzle: P; game: G } | null {
  if (!isDateKey(date)) return null;

  const puzzle = repo.puzzles.get(guildId, date);
  const game = repo.games.get(guildId, date, userId);

  return puzzle && game ? { puzzle, game } : null;
}

/** The puzzle number of `date` and the time left before the next one. */
export const dayOf = (
  date: string,
  first: string,
  now: number,
  tz: string,
): { number: number; untilNext: string } => ({
  number: puzzleNumber(date, first),
  untilNext: untilNext(now, tz),
});
