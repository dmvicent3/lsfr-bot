export type { Period } from "../../core/types.ts";

export interface Standing {
  userId: string;
  points: number;
  filled: number;
  lastFinishedAt: number;
}

export interface PlayerStats {
  points: number;
  days: number;
  avgFilled: number | null;
  perfect: number;
  currentStreak: number;
  longestStreak: number;
}
