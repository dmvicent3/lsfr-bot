import { readFileSync } from "node:fs";
import type { WordLists } from "../types.ts";

export const SUPPORTED_LENGTHS: readonly number[] = [4, 5, 6, 7];
/** Lengths with an accepted-guess list; Snake takes guesses of 2 to 10 letters. */
export const ACCEPTED_LENGTHS: readonly number[] = [2, 3, 4, 5, 6, 7, 8, 9, 10];

/** Once-per-process caches: the lists never change while the bot runs. */
const cache = new Map<number, WordLists>();
const acceptedCache = new Map<number, ReadonlySet<string>>();

const read = (name: string): string[] =>
  readFileSync(new URL(name, import.meta.url), "utf8")
    .split("\n")
    .filter(Boolean);

/** Every accepted guess of `length` letters; null for a length with no list. */
export function acceptedWords(length: number): ReadonlySet<string> | null {
  if (!ACCEPTED_LENGTHS.includes(length)) return null;

  const cached = acceptedCache.get(length);

  if (cached) return cached;

  const words = new Set(read(`accepted-${length}.txt`));
  acceptedCache.set(length, words);

  return words;
}

/** The lists for `length`; null for a length with no lists. */
export function wordLists(length: number): WordLists | null {
  if (!SUPPORTED_LENGTHS.includes(length)) return null;

  const cached = cache.get(length);

  if (cached) return cached;

  const lists = {
    answers: read(`answers-${length}.txt`),
    accepted: acceptedWords(length) ?? new Set<string>(),
  };
  cache.set(length, lists);

  return lists;
}
