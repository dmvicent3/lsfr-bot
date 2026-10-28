import { readFileSync } from "node:fs";
import type { WordLists } from "../types.ts";

export const SUPPORTED_LENGTHS: readonly number[] = [4, 5, 6, 7];

/** Once-per-process cache: the lists never change while the bot runs. */
const cache = new Map<number, WordLists>();

const read = (name: string): string[] =>
  readFileSync(new URL(name, import.meta.url), "utf8")
    .split("\n")
    .filter(Boolean);

/** The lists for `length`; null for a length with no lists. */
export function wordLists(length: number): WordLists | null {
  if (!SUPPORTED_LENGTHS.includes(length)) return null;

  const cached = cache.get(length);

  if (cached) return cached;

  const lists = {
    answers: read(`answers-${length}.txt`),
    accepted: new Set(read(`accepted-${length}.txt`)),
  };
  cache.set(length, lists);

  return lists;
}
