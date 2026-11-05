import type { BankWord } from "../words/load.ts";
import { setBit } from "./bits.ts";
import type { Lexicon, Lexicons } from "./types.ts";

function lexiconOf(words: BankWord[]): Lexicon {
  const len = words[0]!.word.length;
  const blocks = Math.ceil(words.length / 32);
  const at = Array.from({ length: len }, () =>
    Array.from({ length: 26 }, () => new Uint32Array(blocks)),
  );
  const all = new Uint32Array(blocks);

  words.forEach((w, k) => {
    setBit(all, k);

    for (let pos = 0; pos < len; pos++) setBit(at[pos]![w.word.charCodeAt(pos) - 97]!, k);
  });

  return { words, at, all };
}

export function buildLexicons(bank: BankWord[]): Lexicons {
  const byLength = Map.groupBy(bank, (w) => w.word.length);

  return new Map([...byLength].map(([len, words]) => [len, lexiconOf(words)]));
}

/** One set per bank array, built on first use (the bank is fixed for the process). */
const cache = new WeakMap<BankWord[], Lexicons>();

export function lexiconsFor(bank: BankWord[]): Lexicons {
  let lex = cache.get(bank);

  if (!lex) {
    lex = buildLexicons(bank);
    cache.set(bank, lex);
  }

  return lex;
}
