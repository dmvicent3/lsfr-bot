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

export interface Game {
  guildId: string;
  userId: string;
  kind: Kind;
  date: string;
  slot: string;
  level: Level;
  givens: string;
  solution: string;
  cells: string;
  wrong: string;
  cursor: number;
  checks: number;
  startedAt: number;
  solvedAt: number | null;
  points: number | null;
  streak: number | null;
}

export type Direction = "left" | "up" | "down" | "right";

/** One move result; note is the ephemeral line shown to the player. */
export interface Step {
  game: Game;
  note: string | null;
  solved: boolean;
}
