import { ALL_LETTERS, andInto, letterBit, members, orInto } from "./bits.ts";
import type { BankWord } from "../words/load.ts";
import type { ArcState, Lexicon } from "./types.ts";

/** The words of slot i's length whose every letter its cells still allow (used words included). */
function fitting(st: ArcState, i: number, lex: Lexicon): Uint32Array {
  const out = Uint32Array.from(lex.all);
  const any = new Uint32Array(out.length);

  st.slots[i]!.cells.forEach((cell, pos) => {
    const dom = st.dom[cell]!;

    if (dom === ALL_LETTERS) return;

    any.fill(0);

    for (let c = 0; c < 26; c++) if (dom & (1 << c)) orInto(any, lex.at[pos]![c]!);

    andInto(out, any);
  });

  return out;
}

/** The unused words slot i can still take. */
export function options(st: ArcState, i: number): BankWord[] {
  const lex = st.lex.get(st.slots[i]!.cells.length);

  if (!lex) return [];

  return members(fitting(st, i, lex))
    .map((k) => lex.words[k]!)
    .filter((w) => !st.used.has(w.word));
}

/** Sets a cell's letters, remembering the old ones; true when they changed. */
export function narrow(st: ArcState, cell: number, dom: number): boolean {
  if (st.dom[cell] === dom) return false;

  st.trail.push(cell, st.dom[cell]!);
  st.dom[cell] = dom;

  return true;
}

/** Narrows slot i's cells to the letters its options have; the changed cells, or null at none. */
function revise(st: ArcState, i: number): number[] | null {
  const words = options(st, i);
  const { cells } = st.slots[i]!;

  st.counts[i] = words.length;

  if (words.length === 0) return null;

  const allowed = cells.map((_, pos) => words.reduce((m, w) => m | letterBit(w.word, pos), 0));

  return cells.filter((cell, pos) => narrow(st, cell, st.dom[cell]! & allowed[pos]!));
}

/** Revises open slots until nothing narrows; false when some slot is left with no word. */
export function propagate(st: ArcState, queue: number[]): boolean {
  const queued = new Set(queue);

  for (let head = 0; head < queue.length; head++) {
    const i = queue[head]!;

    queued.delete(i);

    if (st.answers[i]) continue;

    const changed = revise(st, i);

    if (!changed) return false;

    for (const j of changed.flatMap((cell) => st.through[cell]!)) {
      if (j === i || st.answers[j] || queued.has(j)) continue;

      queued.add(j);
      queue.push(j);
    }
  }

  return true;
}

/** Restores every cell narrowed since the trail had `mark` entries. */
export function undoTo(st: ArcState, mark: number): void {
  while (st.trail.length > mark) {
    const dom = st.trail.pop()!;

    st.dom[st.trail.pop()!] = dom;
  }
}
