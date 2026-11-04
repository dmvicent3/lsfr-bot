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
 * Writes a typed word into a slot, unjudged: lowercase letters, `.` or a space to blank a cell.
 * Only cells typed differently from what the player was `shown` change, so the other word through
 * a square can't undo this one; revealed (uppercase) letters always stay. The line notes when a
 * revealed letter was kept over a typed one.
 */
export function enter(
  state: PlayState,
  slotIndex: number,
  text: string,
  shown: string = state.cells,
): Entry {
  const { puzzle, cells } = state;
  const slot = puzzle.slots[slotIndex];

  if (state.finished || !slot) return { kind: "stale" };

  const word = typedWord(text, slot.cells.length);

  if (!/^[a-z.]+$/.test(word) || word.length !== slot.cells.length)
    return { kind: "bad", len: slot.cells.length };

  const old = slot.cells.map((cell) => cells[cell]!);
  const untouched = (k: number) => word[k] === shown[slot.cells[k]!]!.toLowerCase();
  const keep = (ch: string, k: number) => isRevealed(ch) || untouched(k);
  const kept = old.map((ch, k) => (keep(ch, k) ? ch : word[k]!));
  const clash = old.some((ch, k) => clashes(ch, word[k]!));

  return {
    kind: "entered",
    cells: fill(cells, slot.cells, kept.join("")),
    line: keptLine(clash ? [slot] : []),
  };
}

/** The typed text, lowercase, spaces as blanks; outer spaces dropped unless they fill the slot. */
function typedWord(text: string, len: number): string {
  const lower = text.toLowerCase();

  return (lower.length === len ? lower : lower.trim()).replaceAll(" ", EMPTY_CELL);
}
