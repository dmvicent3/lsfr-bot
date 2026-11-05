export type Dir = "a" | "d";

/** Grid sizes: the daily is 5; practice is 5, 7 or 15. */
export type Size = 5 | 7 | 15;

export interface Slot {
  n: number;
  dir: Dir;
  cells: number[];
}

export interface Puzzle {
  size: Size;
  blocks: number[];
  slots: Slot[];
  /** Lowercase answers, parallel to `slots`. */
  answers: string[];
}

/** A built puzzle with its clue texts, parallel to `puzzle.slots`. */
export interface StoredPuzzle {
  puzzle: Puzzle;
  clues: string[];
}

/** One player's daily game. `cells`: size² chars, `#` block, `.` empty, else a letter. */
export interface Game {
  guildId: string;
  date: string;
  userId: string;
  cells: string;
  wrong: number;
  reveals: number;
  lastLine: string | null;
  solved: boolean | null;
  points: number | null;
  streak: number | null;
  startedAt: number;
  finishedAt: number | null;
}

/** A player's practice round: its own puzzle, no scoring. */
export interface Practice extends StoredPuzzle {
  guildId: string;
  userId: string;
  cells: string;
  wrong: number;
  reveals: number;
  lastLine: string | null;
  startedAt: number;
  finishedAt: number | null;
}

export interface Award {
  points: number;
  parts: string[];
}
