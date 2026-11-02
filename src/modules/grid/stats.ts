import { currentStreak } from "../../core/daily.ts";
import { sum } from "../../core/sum.ts";
import { CELLS } from "./scoring.ts";
import type { PlayerStats } from "./ranking-types.ts";
import type { Game } from "./types.ts";

/** Totals over one player finished daily games, oldest first. */
export function playerStats(all: Game[], today: string): PlayerStats {
  const games = all.filter((g) => g.finishedAt !== null);
  const filled = games.map((g) => g.filled ?? 0);
  const last = games.at(-1);

  return {
    points: sum(games.map((g) => g.points ?? 0)),
    days: games.length,
    avgFilled: games.length > 0 ? sum(filled) / games.length : null,
    perfect: filled.filter((f) => f === CELLS).length,
    currentStreak: currentStreak(
      last ? { date: last.date, won: true, streak: last.streak ?? 0 } : null,
      today,
    ),
    longestStreak: Math.max(0, ...games.map((g) => g.streak ?? 0)),
  };
}
