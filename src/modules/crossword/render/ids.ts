import type { Slot } from "../types.ts";

type SlotRef = Pick<Slot, "n" | "dir">;

/** `6a` / `12d`: a slot as it appears in ids and select values. */
export const slotKey = (s: SlotRef): string => `${s.n}${s.dir}`;

/** Custom ids; `scope` is the puzzle date or "practice", `stamp` the game's startedAt in base 36. */
export const pickId = (scope: string, stamp: string): string => `crossword:pick:${scope}:${stamp}`;

export const answerId = (scope: string, stamp: string, slot: SlotRef): string =>
  `crossword:answer:${scope}:${stamp}:${slotKey(slot)}`;

/** A square's button; a block's carries `x` so its id stays unique without opening anything. */
export const cellId = (scope: string, stamp: string, cell: number, block = false): string =>
  `crossword:cell:${scope}:${stamp}:${block ? "x" : ""}${cell}`;

export const cellWordId = (scope: string, stamp: string, cell: number): string =>
  `crossword:cellword:${scope}:${stamp}:${cell}`;

export const revealId = (scope: string, stamp: string): string =>
  `crossword:reveal:${scope}:${stamp}`;

export const checkId = (scope: string, stamp: string): string =>
  `crossword:check:${scope}:${stamp}`;

export const giveUpId = (scope: string, stamp: string): string =>
  `crossword:giveup:${scope}:${stamp}`;

export const newId = (size: number): string => `crossword:new:${size}`;

/** The index of the slot a `<n><a|d>` id part or select value names; -1 when none. */
export const slotIndexOf = (slots: SlotRef[], key: string | undefined): number =>
  slots.findIndex((s) => slotKey(s) === key);

const SIZES = new Map<string, 5 | 7>([
  ["5", 5],
  ["7", 7],
]);

/** The size in a `crossword:new:<size>` id part; null when it is not one. */
export const sizeOf = (part: string | undefined): 5 | 7 | null => SIZES.get(part ?? "") ?? null;
