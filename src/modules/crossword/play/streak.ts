import { dailyStreak as streakAfter } from "../../../core/daily.ts";
import type { CrosswordRepo } from "../store/repo.ts";
import type { Game } from "../types.ts";

/** The streak after playing a game: every finished game counts as a day. */
export function dailyStreak(repo: CrosswordRepo, g: Game): number {
  return streakAfter(repo.games.lastFinishedBefore(g.guildId, g.userId, g.date), g.date);
}
