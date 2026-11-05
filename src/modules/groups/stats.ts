import { dailyStats } from "../../core/daily-stats.ts";
import type { PlayerStats } from "./ranking-types.ts";
import type { Game } from "./types.ts";

/** Totals over one player's finished daily games, oldest first. */
export function playerStats(all: Game[], today: string): PlayerStats {
  const { avgScore, points, days, currentStreak, longestStreak } = dailyStats(
    all,
    today,
    (g) => g.mistakes,
    -1,
  );
  const solves = all.filter((g) => g.finishedAt !== null && g.solved);
  const perfect = solves.filter((g) => g.mistakes === 0).length;

  return {
    points,
    days,
    solved: solves.length,
    avgMistakes: avgScore,
    perfect,
    currentStreak,
    longestStreak,
  };
}
