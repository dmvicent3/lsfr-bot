import type { Award, Slot, StoredPuzzle } from "../types.ts";

/** What the board, result and components need; `scope` is the puzzle date or "practice". */
export interface BoardView {
  scope: string;
  /** The game's `startedAt` in base 36; ties components and modals to this round. */
  stamp: string;
  /** The puzzle number; null for a practice crossword. */
  number: number | null;
  stored: StoredPuzzle;
  cells: string;
  wrong: number;
  reveals: number;
  lastLine: string | null;
  /** The running base points, or the stored award points once finished. */
  points: number;
  finished: boolean;
  /** Finished with a correct grid (a daily's stored verdict). */
  solved: boolean;
  /** Header time: now − startedAt, or finishedAt − startedAt once finished. */
  elapsedMs: number;
  /** The points breakdown of a finished daily. */
  award: Award | null;
  /** Time to the next crossword, from core `untilNext`; daily only. */
  untilNext?: string;
}

/** One clue's answer modal; `value` prefills the input with the slot's current letters. */
export interface ClueModal {
  scope: string;
  stamp: string;
  slot: Slot;
  clue: string;
  value?: string | undefined;
}
