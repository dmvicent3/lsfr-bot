import type { Slot } from "../types.ts";
import { ALL_LETTERS, letterBit } from "./bits.ts";
import { narrow, options, propagate, undoTo } from "./domains.ts";
import { byRank } from "./order.ts";
import type { ArcState, Lexicons } from "./types.ts";

/** The open slot with the fewest words left; -1 when every slot has its answer. */
function mostConstrained(st: ArcState): number {
  let best = -1;

  for (let i = 0; i < st.slots.length; i++) {
    if (!st.answers[i] && (best < 0 || st.counts[i]! < st.counts[best]!)) best = i;
  }

  return best;
}

/** Writes a word into slot i and propagates; false when that leaves some slot without a word. */
function place(st: ArcState, i: number, word: string): boolean {
  const { cells } = st.slots[i]!;

  cells.forEach((cell, pos) => narrow(st, cell, letterBit(word, pos)));
  st.answers[i] = word;
  st.used.add(word);

  return propagate(st, [...new Set(cells.flatMap((cell) => st.through[cell]!))]);
}

function unplace(st: ArcState, i: number, saved: { mark: number; counts: number[] }): void {
  undoTo(st, saved.mark);
  st.used.delete(st.answers[i]!);
  st.answers[i] = "";
  st.counts = [...saved.counts];
}

/** Backtracking over arc-consistent letter domains; false when impossible or the node cap is hit. */
export function arcSolve(st: ArcState): boolean {
  const i = mostConstrained(st);

  if (i < 0) return true;

  for (const w of byRank(options(st, i), st.random)) {
    if (++st.nodes > st.cap) return false;

    const saved = { mark: st.trail.length, counts: [...st.counts] };

    if (place(st, i, w.word) && arcSolve(st)) return true;

    unplace(st, i, saved);
  }

  return false;
}

interface Start {
  slots: Slot[];
  lex: Lexicons;
  random: () => number;
  cap: number;
}

/** A fresh state over `cells` squares, every slot revised once; null when some slot has no word. */
export function arcState(o: Start, cells: number, avoid: Set<string>): ArcState | null {
  const through: number[][] = Array.from({ length: cells }, () => []);

  o.slots.forEach((s, i) => s.cells.forEach((cell) => through[cell]!.push(i)));

  const st: ArcState = {
    ...o,
    dom: new Int32Array(cells).fill(ALL_LETTERS),
    trail: [],
    through,
    counts: o.slots.map(() => 0),
    used: new Set(avoid),
    answers: o.slots.map(() => ""),
    nodes: 0,
  };

  return propagate(
    st,
    o.slots.map((_, i) => i),
  )
    ? st
    : null;
}

/** Fills the slots with bank words, no word twice; the answers, or null. */
export function arcFill(o: Start, cells: number, avoid: Set<string>): string[] | null {
  const st = arcState(o, cells, avoid);

  return st && arcSolve(st) ? st.answers : null;
}
