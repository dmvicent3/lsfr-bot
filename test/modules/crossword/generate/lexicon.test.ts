import { expect, test } from "bun:test";
import { members } from "../../../../src/modules/crossword/generate/bits.ts";
import { buildLexicons, lexiconsFor } from "../../../../src/modules/crossword/generate/lexicon.ts";
import type { BankWord } from "../../../../src/modules/crossword/words/load.ts";

const bw = (word: string): BankWord => ({ word, def: word, rank: 0 });
const bank = ["cat", "cot", "dog", "bird"].map(bw);
const c = (ch: string) => ch.charCodeAt(0) - 97;

test("one lexicon per length, words indexed by position and letter", () => {
  const lex = buildLexicons(bank);
  const three = lex.get(3)!;

  expect([...lex.keys()].toSorted((a, b) => a - b)).toEqual([3, 4]);
  expect(three.words.map((w) => w.word)).toEqual(["cat", "cot", "dog"]);
  expect(members(three.all)).toEqual([0, 1, 2]);
  expect(members(three.at[0]![c("c")]!)).toEqual([0, 1]);
  expect(members(three.at[1]![c("o")]!)).toEqual([1, 2]);
  expect(members(three.at[2]![c("x")]!)).toEqual([]);
});

test("cached per bank array", () => {
  expect(lexiconsFor(bank)).toBe(lexiconsFor(bank));
});
