import type { Size, Slot } from "../types.ts";
import type { BankWord } from "../words/load.ts";
import { arcFill } from "./arc-fill.ts";
import { solve, type FillState } from "./fill.ts";
import { indexFor } from "./index.ts";
import { lexiconsFor } from "./lexicon.ts";

export interface FillOptions {
  bank: BankWord[];
  size: Size;
  random: () => number;
  avoid: Set<string>;
}

/** Answers for the slots, parallel to them, or null within `cap` placements. */
type Filler = (slots: Slot[], o: FillOptions, cap: number) => string[] | null;

/** Plain backtracking with forward checks: enough for 5×5 and 7×7. */
const backtrack: Filler = (slots, o, cap) => {
  const state: FillState = {
    slots,
    index: indexFor(o.bank),
    letters: Array<string>(o.size * o.size).fill(""),
    used: new Set(o.avoid),
    answers: slots.map(() => ""),
    random: o.random,
    nodes: 0,
    cap,
  };

  return solve(state) ? state.answers : null;
};

/** Arc-consistent letter domains: 15×15 needs the stronger pruning. */
const arc: Filler = (slots, o, cap) =>
  arcFill({ slots, lex: lexiconsFor(o.bank), random: o.random, cap }, o.size ** 2, o.avoid);

/**
 * How each size fills: placements per try (deterministic, unlike wall time) and tries per pattern.
 * 15×15 restarts often with a small cap: a bad early choice is cheaper to redraw than to search.
 */
export const FILLS: Record<Size, { fill: Filler; cap: number; tries: number }> = {
  5: { fill: backtrack, cap: 2000, tries: 1 },
  7: { fill: backtrack, cap: 3000, tries: 1 },
  15: { fill: arc, cap: 300, tries: 4 },
};
