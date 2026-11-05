import { shuffle } from "../../trivia/shuffle.ts";
import type { Category } from "../types.ts";
import { fits } from "./clash.ts";

export const GROUP_SIZE = 4;

/** Every member of a category: its playable words and the clash-only ones. */
export const membersOf = (c: Category): Set<string> => new Set([...c.words, ...c.also]);

/**
 * Four of `c`'s words in random order that belong to none of `others` and clash with nothing on
 * `board` or with each other; null when there are not four.
 */
export function pickWords(
  c: Category,
  others: readonly Set<string>[],
  board: readonly string[],
  random: () => number,
): string[] | null {
  const out: string[] = [];

  for (const word of shuffle(c.words, random)) {
    if (others.some((m) => m.has(word)) || !fits(word, [...board, ...out])) continue;

    out.push(word);

    if (out.length === GROUP_SIZE) return out;
  }

  return null;
}
