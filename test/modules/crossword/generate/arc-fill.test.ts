import { describe, expect, test } from "bun:test";
import { lcg } from "../../../../src/core/random.ts";
import { arcFill } from "../../../../src/modules/crossword/generate/arc-fill.ts";
import { buildLexicons } from "../../../../src/modules/crossword/generate/lexicon.ts";
import { slotsOf } from "../../../../src/modules/crossword/generate/slots.ts";
import type { BankWord } from "../../../../src/modules/crossword/words/load.ts";

const bw = (word: string, rank = 0): BankWord => ({ word, def: word, rank });
const rows = ["abcde", "fghij", "klmno", "pqrst", "uvwxy"];
const lines = [...rows, ...[0, 1, 2, 3, 4].map((c) => rows.map((r) => r[c]).join(""))];
const slots = slotsOf(5, []);
const start = (words: string[], seed = 1) => ({
  slots,
  lex: buildLexicons(words.map((w) => bw(w))),
  random: lcg(seed),
  cap: 1000,
});

/** The letter each cell gets, failing on a clash between crossing answers. */
function grid(answers: string[]): string[] {
  const out: string[] = [];

  slots.forEach((s, k) =>
    s.cells.forEach((cell, pos) => {
      expect(out[cell] ?? answers[k]![pos]).toBe(answers[k]![pos]);
      out[cell] = answers[k]![pos]!;
    }),
  );

  return out;
}

describe("arcFill", () => {
  test("fills an open square from the only words that fit, crossings agreeing", () => {
    const answers = arcFill(start([...lines, "zzzzz", "abcdz"]), 25, new Set());

    expect(answers).not.toBeNull();
    expect(grid(answers!).join("")).toBe(rows.join(""));
  });

  test("never uses a word twice", () => {
    // A symmetric square: its rows equal its columns, so only one-use-each forbids the fill.
    const sym = ["abcde", "bfghi", "cgjkl", "dhkmn", "eilno"];

    expect(arcFill(start(sym), 25, new Set())).toBeNull();
  });

  test("null when an avoided word is needed, or no word fits", () => {
    expect(arcFill(start(lines), 25, new Set(["abcde"]))).toBeNull();
    expect(arcFill(start(["abc", "def"]), 25, new Set())).toBeNull();
  });

  test("null when the node cap is hit", () => {
    expect(arcFill({ ...start(lines), cap: 0 }, 25, new Set())).toBeNull();
  });

  test("same seed, same answers", () => {
    const many = [...lines, "abcdz", "zzzzz"];

    expect(arcFill(start(many, 4), 25, new Set())).toEqual(arcFill(start(many, 4), 25, new Set()));
  });
});
