export const LEVELS = ["easy", "medium", "hard"] as const;

export type Level = (typeof LEVELS)[number];

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
  /** 81 × 9 flags, cell i digit d at `i*9 + d-1`; `''` means none. */
  notes: string;
  /** Digit buttons toggle notes instead of placing digits. */
  noteMode: boolean;
}

export type Direction = "left" | "up" | "down" | "right";

/** One move result; note is the ephemeral line shown to the player. */
export interface Step {
  game: Game;
  note: string | null;
  solved: boolean;
}

/** The day's board for one server and level. */
export interface Puzzle {
  guildId: string;
  date: string;
  level: Level;
  givens: string;
  solution: string;
}

export interface GameKey {
  guildId: string;
  userId: string;
  kind: Kind;
  date: string;
  slot: string;
}

export type { Period } from "../../core/types.ts";

export interface Standing {
  userId: string;
  points: number;
  solved: number;
  lastSolvedAt: number;
}

export interface PlayerStats {
  points: number;
  solved: Record<Level, number>;
  bestMs: Record<Level, number | null>;
  avgMs: Record<Level, number | null>;
  currentStreak: number;
  longestStreak: number;
}
