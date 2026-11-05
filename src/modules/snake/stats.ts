import { dailyStats } from "../../core/daily-stats.ts";
import { sum } from "../../core/sum.ts";
import type { PlayerStats } from "./ranking-types.ts";
import type { Game } from "./types.ts";

/** Totals over one player's finished daily games, oldest first; guess counts are over solves. */
export function playerStats(all: Game[], today: string): PlayerStats {
  const { points, days, currentStreak, longestStreak } = dailyStats(
    all,
    today,
    (g) => g.guesses.length,
    1,
  );
  const counts = all.filter((g) => g.finishedAt !== null && g.solved).map((g) => g.guesses.length);

  return {
    points,
    days,
    solved: counts.length,
    avgGuesses: counts.length > 0 ? sum(counts) / counts.length : null,
    best: counts.length > 0 ? Math.min(...counts) : null,
    currentStreak,
    longestStreak,
  };
}
