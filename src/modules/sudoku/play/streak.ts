import { dailyStreak as streakAfter } from "../../../core/daily.ts";
import type { SudokuRepo } from "../store/repo.ts";
import type { Game } from "../types.ts";

/** The streak after solving `g`: unchanged if another daily was solved the same day. */
export function dailyStreak(repo: SudokuRepo, g: Game): number {
  const sameDay = repo.games.solvedOn(g.guildId, g.userId, g.date).find((o) => o.slot !== g.slot);

  if (sameDay?.streak) return sameDay.streak;

  return streakAfter(repo.games.lastSolvedBefore(g.guildId, g.userId, g.date), g.date);
}
