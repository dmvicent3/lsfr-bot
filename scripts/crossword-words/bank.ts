import { leaks } from "../../src/modules/crossword/words/leak.ts";
import type { BankWord } from "../../src/modules/crossword/words/load.ts";

const MIN_GLOSS = 3;

export interface BankInput {
  enable: Set<string>;
  /** Frequency list, most common first. */
  frequent: string[];
  blocked: Set<string>;
  definitions: Map<string, string>;
  common: number;
}

/** ENABLE ∩ top-`common` frequent words, 3-7 letters, with a clean WordNet gloss; sorted by word. */
export function buildBank({
  enable,
  frequent,
  blocked,
  definitions,
  common,
}: BankInput): BankWord[] {
  const out: BankWord[] = [];

  for (const [rank, word] of frequent.slice(0, common).entries()) {
    const def = definitions.get(word);

    if (!/^[a-z]{3,7}$/.test(word) || !enable.has(word) || blocked.has(word)) continue;

    if (def === undefined || def.length < MIN_GLOSS || leaks(def, word)) continue;

    out.push({ word, def, rank });
  }

  return out.toSorted((a, b) => a.word.localeCompare(b.word));
}
