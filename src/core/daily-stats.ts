import { currentStreak } from "./daily.ts";
import { sum } from "./sum.ts";

/** A daily game as player stats need it. */
export interface StatGame {
  date: string;
  points: number | null;
  streak: number | null;
  finishedAt: number | null;
}

export interface DailyStats {
  points: number;
  days: number;
  avgScore: number | null;
  perfect: number;
  currentStreak: number;
  longestStreak: number;
}

/**
 * Totals over one player's daily games, oldest first; unfinished games are skipped. `perfect`
 * counts games whose score reached `max`.
 */
export function dailyStats<G extends StatGame>(
  all: G[],
  today: string,
  score: (g: G) => number,
  max: number,
): DailyStats {
  const games = all.filter((g) => g.finishedAt !== null);
  const scores = games.map(score);
  const last = games.at(-1);

  return {
    points: sum(games.map((g) => g.points ?? 0)),
    days: games.length,
    avgScore: games.length > 0 ? sum(scores) / games.length : null,
    perfect: scores.filter((s) => s === max).length,
    currentStreak: currentStreak(
      last ? { date: last.date, won: true, streak: last.streak ?? 0 } : null,
      today,
    ),
    longestStreak: Math.max(0, ...games.map((g) => g.streak ?? 0)),
  };
}
