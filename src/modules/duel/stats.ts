import { dailyStats } from "../../core/daily-stats.ts";
import { QUESTIONS } from "./questions/bands.ts";
import type { Game, PlayerStats } from "./types.ts";

/** Totals over one player's finished daily games, oldest first. */
export function playerStats(all: Game[], today: string): PlayerStats {
  const { avgScore, ...s } = dailyStats(all, today, (g) => g.correct ?? 0, QUESTIONS);

  return { ...s, avgCorrect: avgScore };
}
