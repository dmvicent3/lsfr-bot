import { nextStreak } from "../../../core/daily.ts";
import type { DuelRepo } from "../store/repo.ts";
import type { Game } from "../types.ts";

/** The streak after playing `g`: every finished game counts as a day. */
export function dailyStreak(repo: DuelRepo, g: Game): number {
  const last = repo.games.lastFinishedBefore(g.guildId, g.userId, g.date);
  const prev = last ? { date: last.date, won: true, streak: last.streak ?? 0 } : null;

  return nextStreak(prev, g.date, true);
}
