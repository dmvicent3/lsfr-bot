import { dailyStreak as streakAfter } from "../../../core/daily.ts";
import type { DuelRepo } from "../store/repo.ts";
import type { Game } from "../types.ts";

/**
 * The streak after playing `g`: every finished game counts as a day. Finishing an older day after
 * a later one leaves the later stored streak stale; that is accepted.
 */
export function dailyStreak(repo: DuelRepo, g: Game): number {
  return streakAfter(repo.games.lastFinishedBefore(g.guildId, g.userId, g.date), g.date);
}
