import { solve, type FillState } from "./fill.ts";
import { indexFor, type WordIndex } from "./index.ts";
import { PATTERNS } from "./patterns.ts";
import { slotsOf } from "./slots.ts";
import type { Puzzle } from "../types.ts";
import type { BankWord } from "../words/load.ts";

/** Placements tried per pattern before moving on (deterministic, unlike wall time). */
const NODE_CAP: Record<5 | 7, number> = { 5: 2000, 7: 3000 };

interface Options {
  bank: BankWord[];
  size: 5 | 7;
  random: () => number;
  avoid: Set<string>;
}

function shuffled<T>(items: T[], random: () => number): T[] {
  const out = [...items];

  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));

    [out[i], out[j]] = [out[j]!, out[i]!];
  }

  return out;
}

function attempt(blocks: number[], index: WordIndex, o: Options): Puzzle | null {
  const slots = slotsOf(o.size, blocks);
  const state: FillState = {
    slots,
    index,
    letters: Array<string>(o.size * o.size).fill(""),
    used: new Set(o.avoid),
    answers: slots.map(() => ""),
    random: o.random,
    nodes: 0,
    cap: NODE_CAP[o.size],
  };

  return solve(state) ? { size: o.size, blocks, slots, answers: state.answers } : null;
}

/** A filled grid from a random pattern, or null when every pattern fails. */
export function generate(o: Options): Puzzle | null {
  const index = indexFor(o.bank);

  for (const blocks of shuffled(PATTERNS[o.size], o.random)) {
    const puzzle = attempt(blocks, index, o);

    if (puzzle) return puzzle;
  }

  return null;
}
