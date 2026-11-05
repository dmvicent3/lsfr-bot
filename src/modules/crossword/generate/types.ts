import type { Slot } from "../types.ts";
import type { BankWord } from "../words/load.ts";

/**
 * The bank's words of one length as bitsets over their indices in `words`: `at[pos][c]` holds the
 * words with letter `a` + c at `pos`, `all` every word.
 */
export interface Lexicon {
  words: BankWord[];
  at: Uint32Array[][];
  all: Uint32Array;
}

/** A lexicon per word length. */
export type Lexicons = Map<number, Lexicon>;

/** The arc-consistent fill in progress. */
export interface ArcState {
  slots: Slot[];
  lex: Lexicons;
  /** Per cell, the letters it can still take (see `ALL_LETTERS`). */
  dom: Int32Array;
  /** `cell, previous domain` pairs, popped to undo. */
  trail: number[];
  /** Per cell, the slots through it. */
  through: number[][];
  /** Per open slot, how many unused words still fit it. */
  counts: number[];
  used: Set<string>;
  /** Lowercase answers, parallel to `slots`; "" while open. */
  answers: string[];
  random: () => number;
  nodes: number;
  cap: number;
}
