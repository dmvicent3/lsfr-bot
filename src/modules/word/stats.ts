import { sum } from "../../core/sum.ts";
import { currentStreak } from "../../core/daily.ts";
import type { Game, PlayerStats } from "./types.ts";

/** Totals over one player's finished games, oldest first; wins spread over `maxAttempts`. */
export function playerStats(games: Game[], today: string, maxAttempts: number): PlayerStats {
  const wins = games.filter((g) => g.won);
  const attempts = wins.map((g) => g.guesses.length);
  const distribution = Array.from(
    { length: maxAttempts },
    (_, i) => attempts.filter((n) => n === i + 1).length,
  );
  const last = games.at(-1);

  return {
    points: sum(games.map((g) => g.points ?? 0)),
    wins: wins.length,
    losses: games.length - wins.length,
    winRate: games.length > 0 ? wins.length / games.length : null,
    currentStreak: currentStreak(
      last ? { date: last.date, won: last.won ?? false, streak: last.streak ?? 0 } : null,
      today,
    ),
    longestStreak: Math.max(0, ...games.map((g) => g.streak ?? 0)),
    totalGuesses: sum(games.map((g) => g.guesses.length)),
    avgAttempts: attempts.length > 0 ? sum(attempts) / attempts.length : null,
    distribution,
  };
}
