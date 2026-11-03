import type { Slot } from "../types.ts";

type SlotRef = Pick<Slot, "n" | "dir">;

/** `6a` / `12d`: a slot as it appears in ids and select values. */
export const slotKey = (s: SlotRef): string => `${s.n}${s.dir}`;

/** Custom ids; `scope` is the puzzle date or "practice", `stamp` the game's startedAt in base 36. */
export const pickId = (scope: string, stamp: string): string => `crossword:pick:${scope}:${stamp}`;

export const answerId = (scope: string, stamp: string, slot: SlotRef): string =>
  `crossword:answer:${scope}:${stamp}:${slotKey(slot)}`;

export const revealId = (scope: string, stamp: string): string =>
  `crossword:reveal:${scope}:${stamp}`;

export const giveUpId = (scope: string, stamp: string): string =>
  `crossword:giveup:${scope}:${stamp}`;

export const newId = (size: number): string => `crossword:new:${size}`;
