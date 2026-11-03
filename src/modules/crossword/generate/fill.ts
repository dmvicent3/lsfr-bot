import { candidates, type Fixed, type WordIndex } from "./index.ts";
import type { BankWord } from "../words/load.ts";
import type { Slot } from "../types.ts";

export interface FillState {
  slots: Slot[];
  index: WordIndex;
  letters: string[];
  used: Set<string>;
  answers: string[];
  random: () => number;
  nodes: number;
  cap: number;
}

function fixedOf(state: FillState, slot: Slot): Fixed {
  const fixed: Fixed = [];

  slot.cells.forEach((cell, pos) => {
    const ch = state.letters[cell];

    if (ch) fixed.push([pos, ch]);
  });

  return fixed;
}

function optionsFor(state: FillState, i: number): BankWord[] {
  const slot = state.slots[i]!;

  return candidates(state.index, slot.cells.length, fixedOf(state, slot), state.used);
}

/** The open slot with the fewest candidates; null when some open slot has none. */
function mostConstrained(state: FillState): { i: number; options: BankWord[] } | null {
  let best: { i: number; options: BankWord[] } | null = null;

  for (let i = 0; i < state.slots.length; i++) {
    if (state.answers[i]) continue;

    const options = optionsFor(state, i);

    if (!options.length) return null;

    if (!best || options.length < best.options.length) best = { i, options };
  }

  return best;
}

/** Commonest first, with random jitter. */
function ordered(state: FillState, options: BankWord[]): BankWord[] {
  const keyed = options.map((w) => ({ w, k: (w.rank + 1) * (0.25 + state.random()) }));

  return keyed.toSorted((a, b) => a.k - b.k).map((e) => e.w);
}

function place(state: FillState, i: number, word: string): number[] {
  const written: number[] = [];

  state.slots[i]!.cells.forEach((cell, pos) => {
    if (state.letters[cell]) return;

    state.letters[cell] = word[pos]!;
    written.push(cell);
  });
  state.answers[i] = word;
  state.used.add(word);

  return written;
}

function undo(state: FillState, i: number, written: number[]): void {
  for (const cell of written) state.letters[cell] = "";

  state.used.delete(state.answers[i]!);
  state.answers[i] = "";
}

/** Backtracking fill; false when impossible or the node cap is hit. */
export function solve(state: FillState): boolean {
  const pick = mostConstrained(state);

  if (!pick) return state.answers.every(Boolean);

  for (const w of ordered(state, pick.options)) {
    if (++state.nodes > state.cap) return false;

    const written = place(state, pick.i, w.word);

    if (solve(state)) return true;

    undo(state, pick.i, written);
  }

  return false;
}
