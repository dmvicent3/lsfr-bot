import { sum } from "../../core/sum.ts";
import { currentStreak } from "../../core/daily.ts";
import { QUESTIONS } from "./questions/bands.ts";
import type { Game, PlayerStats } from "./types.ts";

/** Totals over one player's finished daily games, oldest first. */
export function playerStats(all: Game[], today: string): PlayerStats {
  const games = all.filter((g) => g.finishedAt !== null);
  const correct = games.map((g) => g.correct ?? 0);
  const last = games.at(-1);

  return {
    points: sum(games.map((g) => g.points ?? 0)),
    days: games.length,
    avgCorrect: games.length > 0 ? sum(correct) / games.length : null,
    perfect: correct.filter((c) => c === QUESTIONS).length,
    currentStreak: currentStreak(
      last ? { date: last.date, won: true, streak: last.streak ?? 0 } : null,
      today,
    ),
    longestStreak: Math.max(0, ...games.map((g) => g.streak ?? 0)),
  };
}
