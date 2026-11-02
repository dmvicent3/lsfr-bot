export type Level = "easy" | "medium" | "hard";

export type Kind = "daily" | "practice";

/** 81 cells, row-major, 0 = empty. */
export type Grid = number[];

export interface Generated {
  givens: string;
  solution: string;
  level: Level;
}

export interface Award {
  points: number;
  parts: string[];
}
