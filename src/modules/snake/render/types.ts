import type { Award, Colour } from "../types.ts";

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

/** A run of tiles drawn as one shape: one tile, or a joined green bar. */
export interface Bar {
  /** Index of the first and last tile in the guess. */
  from: number;
  to: number;
  colour: Colour;
  capStart: boolean;
  capEnd: boolean;
}

/** One guess row of the picture: its number and its tiles' letters and bars. */
export interface Line {
  n: number;
  letters: string;
  bars: Bar[];
}
