import { currentStreak } from "../../../core/daily.ts";
import type { Game } from "../types.ts";
import type { DailyStats } from "./types.ts";

const efficiency = (g: Game): number =>
  g.clicks > 0 ? Math.round(((g.bbbv ?? 0) / g.clicks) * 100) : 100;

/** A player's daily record from their finished dailies, oldest first; null with none. */
export function dailyStats(games: Game[], today: string): DailyStats | null {
  const last = games.at(-1);

  if (!last?.date) return null;

  const wins = games.filter((g) => g.result === "won");
  const lastGame = { date: last.date, won: last.result === "won", streak: last.streak ?? 0 };

  return {
    played: games.length,
    won: wins.length,
    streak: currentStreak(lastGame, today),
    bestStreak: Math.max(0, ...games.map((g) => g.streak ?? 0)),
    points: games.reduce((n, g) => n + (g.points ?? 0), 0),
    bestEfficiency: wins.length > 0 ? Math.max(...wins.map(efficiency)) : null,
  };
}
