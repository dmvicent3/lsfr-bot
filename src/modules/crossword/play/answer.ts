import type { Dir, Slot } from "../types.ts";
import { EMPTY_CELL, fill, isRevealed } from "./cells.ts";
import type { Entry, PlayState } from "./types.ts";

const DIRS: Record<Dir, string> = { a: "Across", d: "Down" };

/** "6 Across" */
export const slotName = (n: number, dir: Dir): string => `${n} ${DIRS[dir]}`;

/** `🔎 Kept the revealed letters in 6 Across and 1 Down`; null when no slot clashed. */
export function keptLine(slots: Slot[]): string | null {
  if (slots.length === 0) return null;

  return `🔎 Kept the revealed letters in ${slots.map((s) => slotName(s.n, s.dir)).join(" and ")}`;
}

/** A typed letter that a revealed letter overrides. */
const clashes = (old: string, typed: string): boolean =>
  isRevealed(old) && typed !== EMPTY_CELL && old.toLowerCase() !== typed;

/**
 * Writes a typed word into a slot, unjudged: lowercase, except cells holding a revealed
 * (uppercase) letter, which stay, and `.` cells, which keep what they hold. The line notes when a
 * revealed letter was kept over a typed one.
 */
export function enter(state: PlayState, slotIndex: number, text: string): Entry {
  const { puzzle, cells } = state;
  const slot = puzzle.slots[slotIndex];

  if (state.finished || !slot) return { kind: "stale" };

  const word = text.trim().toLowerCase();

  if (!/^[a-z.]+$/.test(word) || word.length !== slot.cells.length)
    return { kind: "bad", len: slot.cells.length };

  const old = slot.cells.map((cell) => cells[cell]!);
  const keep = (ch: string, k: number) => isRevealed(ch) || word[k] === EMPTY_CELL;
  const kept = old.map((ch, k) => (keep(ch, k) ? ch : word[k]!));
  const clash = old.some((ch, k) => clashes(ch, word[k]!));

  return {
    kind: "entered",
    cells: fill(cells, slot.cells, kept.join("")),
    line: keptLine(clash ? [slot] : []),
  };
}
