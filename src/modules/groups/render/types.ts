import type { Award, Progress, Puzzle } from "../types.ts";

/** Where a round is: its scope, puzzle and, for a daily, the number and time to the next. */
export interface Where {
  /** The puzzle date, or "practice". */
  scope: string;
  number: number | null;
  puzzle: Puzzle;
  untilNext?: string | undefined;
}

/** What the board, result and buttons need. */
export interface BoardView {
  scope: string;
  /** The round's `startedAt` in base 36; ties buttons to this round. */
  stamp: string;
  /** The puzzle number; null for practice. */
  number: number | null;
  puzzle: Puzzle;
  progress: Progress;
  finished: boolean;
  solved: boolean;
  /** The points breakdown of a finished daily. */
  award: Award | null;
  /** Time to the next puzzle; daily only. */
  untilNext?: string;
}
