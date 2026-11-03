import { describe, expect, test } from "bun:test";
import { lcg } from "../../../../src/core/random.ts";
import { generate } from "../../../../src/modules/crossword/generate/generate.ts";
import { slotsOf } from "../../../../src/modules/crossword/generate/slots.ts";
import { loadBankFile, type BankWord } from "../../../../src/modules/crossword/words/load.ts";

const bw = (word: string, rank = 0): BankWord => ({ word, def: word, rank });
const real = loadBankFile(
  new URL("../../../../src/modules/crossword/words/bank.json", import.meta.url),
);

describe("fill on a fixture bank", () => {
  const rows = ["abcde", "fghij", "klmno", "pqrst", "uvwxy"];
  const lines = [...rows, ...[0, 1, 2, 3, 4].map((c) => rows.map((r) => r[c]).join(""))];
  // Every substring (3+ letters) of the square's lines: any pattern has a solution inside it.
  const words = new Set<string>();

  for (const line of lines)
    for (let a = 0; a < 5; a++) for (let b = a + 3; b <= 5; b++) words.add(line.slice(a, b));

  test("finds a solution built from the fixture", () => {
    const bank = [...words].map((w) => bw(w));
    const puzzle = generate({ bank, size: 5, random: lcg(1), avoid: new Set() });

    expect(puzzle).not.toBeNull();
    expect(puzzle!.answers.every((a) => words.has(a))).toBe(true);
  });

  test("null when the bank cannot fill any pattern", () => {
    const bank = [bw("abc"), bw("dej")];

    expect(generate({ bank, size: 5, random: lcg(1), avoid: new Set() })).toBeNull();
  });

  test("null when avoid removes every word", () => {
    const bank = [...words].map((w) => bw(w));

    expect(generate({ bank, size: 5, random: lcg(1), avoid: words })).toBeNull();
  });
});

describe("real bank", () => {
  const byWord = new Map(real.map((w) => [w.word, w]));

  test("answers are in the bank, agree at crossings, are unique", () => {
    const puzzle = generate({ bank: real, size: 7, random: lcg(3), avoid: new Set() });

    expect(puzzle).not.toBeNull();
    const grid: Record<number, string> = {};

    puzzle!.slots.forEach((s, k) => {
      const a = puzzle!.answers[k]!;

      expect(byWord.has(a)).toBe(true);
      expect(a.length).toBe(s.cells.length);
      s.cells.forEach((c, pos) => {
        expect(grid[c] ?? a[pos]).toBe(a[pos]);
        grid[c] = a[pos]!;
      });
    });
    expect(new Set(puzzle!.answers).size).toBe(puzzle!.answers.length);
    expect(puzzle!.slots).toEqual(slotsOf(7, puzzle!.blocks));
  });

  test("avoided words are never used", () => {
    const first = generate({ bank: real, size: 5, random: lcg(4), avoid: new Set() });
    const avoid = new Set(first!.answers);
    const second = generate({ bank: real, size: 5, random: lcg(4), avoid });

    expect(second).not.toBeNull();
    expect(second!.answers.some((a) => avoid.has(a))).toBe(false);
  });

  test("same seed gives the same puzzle", () => {
    const a = generate({ bank: real, size: 5, random: lcg(9), avoid: new Set() });
    const b = generate({ bank: real, size: 5, random: lcg(9), avoid: new Set() });

    expect(a).toEqual(b);
  });
});
