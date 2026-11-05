import type { Category, Level } from "../../src/modules/groups/types.ts";
import type { Draft } from "./category.ts";
import type { Member } from "./types.ts";

/** How many of a category's most common words its obscurity is judged on. */
const SAMPLE = 8;
/** What one step down a word's senses adds, in units of ln(rank). */
const SENSE_WEIGHT = 0.6;

const mean = (xs: number[]): number => xs.reduce((a, b) => a + b, 0) / xs.length;

/** How obscure a category's words are: their mean ln(rank), plus a share for less common senses. */
export function obscurity(words: Member[]): number {
  const sample = words.slice(0, SAMPLE);

  return mean(sample.map((m) => Math.log(m.rank + 1) + SENSE_WEIGHT * (Math.min(m.sense, 6) - 1)));
}

const LEVELS: Level[] = [0, 1, 2, 3];

/** Level by obscurity quartile across the bank (or the allowlist's own level). */
export function levelled(drafts: Draft[]): Category[] {
  const scored = drafts.map((d) => ({ d, score: obscurity(d.words) }));
  const sorted = scored.map((s) => s.score).toSorted((a, b) => a - b);
  const cut = (q: number) => sorted[Math.floor((q * sorted.length) / 4)] ?? Infinity;
  const levelOf = (score: number): Level =>
    LEVELS[[1, 2, 3].filter((q) => score >= cut(q)).length]!;

  return scored.map(({ d, score }) => ({
    name: d.name,
    level: LEVELS[d.level ?? -1] ?? levelOf(score),
    words: d.words.map((m) => m.word),
    also: d.also,
  }));
}
