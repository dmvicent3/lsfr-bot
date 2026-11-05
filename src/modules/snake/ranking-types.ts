export type { Period } from "../../core/types.ts";

export interface Standing {
  userId: string;
  points: number;
  solved: number;
  lastFinishedAt: number;
}

export interface PlayerStats {
  points: number;
  days: number;
  solved: number;
  /** Mean guesses over solved days; null before the first solve. */
  avgGuesses: number | null;
  /** Fewest guesses in a solve; null before the first solve. */
  best: number | null;
  currentStreak: number;
  longestStreak: number;
}
