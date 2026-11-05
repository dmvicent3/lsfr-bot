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
  avgMistakes: number | null;
  /** Solved without a mistake. */
  perfect: number;
  currentStreak: number;
  longestStreak: number;
}
