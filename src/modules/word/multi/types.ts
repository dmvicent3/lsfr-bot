import type { Award, Game, RefusedReason } from "../types.ts";

/** The multi-board word games. */
export type Mode = "duo" | "quad";

/** What sets a mode apart. */
export interface ModeSpec {
  /** "Word Duo" */
  name: string;
  boards: number;
  attempts: number;
}

/** A server's words for one mode and date, all `length` letters. */
export interface MultiPuzzle {
  guildId: string;
  mode: Mode;
  date: string;
  words: string[];
  length: number;
}

/** One player's game on a multi puzzle; `found` (boards solved) is null while open. */
export interface MultiGame extends Game {
  mode: Mode;
  found: number | null;
}

/** One board as the player sees it: the guesses it took, and the attempt that solved it. */
export interface BoardState {
  word: string;
  guesses: string[];
  /** 1-based; null while unsolved. */
  solvedAt: number | null;
}

export type MultiResult =
  | { kind: "refused"; reason: RefusedReason }
  | { kind: "open"; game: MultiGame }
  | { kind: "finished"; game: MultiGame; award: Award };
