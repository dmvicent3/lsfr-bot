import type { Puzzle } from "../types.ts";
import { fromHex } from "./hex.ts";

/** The group a word index belongs to. */
export const groupOf = (word: number): number => Math.floor(word / 4);

/** Word `4g + k`, lowercase. */
export const wordOf = (p: Puzzle, word: number): string =>
  p.groups[groupOf(word)]?.words[word % 4] ?? "";

/** The words still on the board, in button order. */
export function unsolved(order: string, found: string): number[] {
  const done = new Set(fromHex(found));

  return fromHex(order).filter((w) => !done.has(groupOf(w)));
}
