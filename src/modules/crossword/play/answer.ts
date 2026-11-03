import type { Dir } from "../types.ts";
import { fill, isRevealed } from "./cells.ts";
import type { Entry, PlayState } from "./types.ts";

const DIRS: Record<Dir, string> = { a: "Across", d: "Down" };

/** "6 Across" */
export const slotName = (n: number, dir: Dir): string => `${n} ${DIRS[dir]}`;

/**
 * Writes a typed word into a slot, unjudged: lowercase, except cells holding a revealed
 * (uppercase) letter, which stay. The line notes when a revealed letter was kept over a typed one.
 */
export function enter(state: PlayState, slotIndex: number, text: string): Entry {
  const { puzzle, cells } = state;
  const slot = puzzle.slots[slotIndex];

  if (state.finished || !slot) return { kind: "stale" };

  const word = text.trim().toLowerCase();

  if (!/^[a-z]+$/.test(word) || word.length !== slot.cells.length)
    return { kind: "bad", len: slot.cells.length };

  const kept = slot.cells.map((cell, k) => (isRevealed(cells[cell]) ? cells[cell]! : word[k]!));
  const clash = kept.some((ch, k) => ch.toLowerCase() !== word[k]);
  const line = clash ? `🔎 Kept the revealed letters in ${slotName(slot.n, slot.dir)}` : null;

  return { kind: "entered", cells: fill(cells, slot.cells, kept.join("")), line };
}
