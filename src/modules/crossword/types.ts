export type Dir = "a" | "d";

export interface Slot {
  n: number;
  dir: Dir;
  cells: number[];
}

export interface Puzzle {
  size: 5 | 7;
  blocks: number[];
  slots: Slot[];
  /** Lowercase answers, parallel to `slots`. */
  answers: string[];
}
