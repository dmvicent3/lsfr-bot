import type { Award } from "../types.ts";

/** Where a round is: its scope, answer and, for a daily, the number and time to the next. */
export interface Where {
  /** The puzzle date, or "practice". */
  scope: string;
  number: number | null;
  answer: string;
  untilNext?: string | undefined;
}

/** What the board, result and buttons need. */
export interface BoardView {
  scope: string;
  /** The round's `startedAt` in base 36; ties buttons and the modal to this round. */
  stamp: string;
  /** The puzzle number; null for practice. */
  number: number | null;
  answer: string;
  guesses: string[];
  finished: boolean;
  solved: boolean;
  /** The points breakdown of a finished daily. */
  award: Award | null;
  /** Time to the next puzzle; daily only. */
  untilNext?: string;
}

/** The newest rows that fit, oldest first, and how many earlier ones are left out. */
export interface Shown {
  shown: string[];
  earlier: number;
}
