import { nextStreak } from "../../../core/daily.ts";
import type { GridRepo } from "../store/repo.ts";
import type { Game } from "../types.ts";

/**
 * The streak after playing a game: every finished game counts as a day. Finishing an older day
 * after a later one leaves the later stored streak stale; that is accepted.
 */
export function dailyStreak(repo: GridRepo, g: Game): number {
  const last = repo.games.lastFinishedBefore(g.guildId, g.userId, g.date);
  const prev = last ? { date: last.date, won: true, streak: last.streak ?? 0 } : null;

  return nextStreak(prev, g.date, true);
}
