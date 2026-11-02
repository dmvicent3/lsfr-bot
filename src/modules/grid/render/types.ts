import type { Award, Grid } from "../types.ts";

/** What the board and result need; `scope` is the puzzle date or "practice". */
export interface BoardView {
  scope: string;
  /** The puzzle number; null for a practice grid. */
  number: number | null;
  grid: Grid;
  cells: string[];
  guesses: number;
  lastMiss: string | null;
  /** The running cell total, or the stored award points once finished. */
  points: number;
  finished: boolean;
  /** The points breakdown, only on the move that finished a daily game. */
  award?: Award | null;
  /** Time to the next grid, from core `untilNext`; daily only. */
  untilNext?: string;
}
