import { dailyStats } from "../../core/daily-stats.ts";
import type { PlayerStats } from "./ranking-types.ts";
import type { Game } from "./types.ts";

/** Totals over one player finished daily games, oldest first. */
export function playerStats(all: Game[], today: string): PlayerStats {
  const { avgScore, points, days, currentStreak, longestStreak } = dailyStats(
    all,
    today,
    (g) => g.wrong,
    -1,
  );
  const solved = all.filter((g) => g.finishedAt !== null && g.solved).length;

  return { points, days, solved, avgWrongChecks: avgScore, currentStreak, longestStreak };
}
