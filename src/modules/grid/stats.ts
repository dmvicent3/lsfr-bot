import { dailyStats } from "../../core/daily-stats.ts";
import { CELLS } from "./scoring.ts";
import type { PlayerStats } from "./ranking-types.ts";
import type { Game } from "./types.ts";

/** Totals over one player finished daily games, oldest first. */
export function playerStats(all: Game[], today: string): PlayerStats {
  const { avgScore, ...s } = dailyStats(all, today, (g) => g.filled ?? 0, CELLS);

  return { ...s, avgFilled: avgScore };
}
