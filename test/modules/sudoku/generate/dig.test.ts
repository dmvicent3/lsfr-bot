import { describe, expect, test } from "bun:test";
import { countSolutions } from "../../../../src/modules/sudoku/generate/count.ts";
import { dig } from "../../../../src/modules/sudoku/generate/dig.ts";
import { fill } from "../../../../src/modules/sudoku/generate/fill.ts";
import { seeded } from "../../shed/testing/random.ts";

const SEEDS = [1, 2, 3];

describe("dig", () => {
  test("dig keeps one solution", () => {
    for (const seed of SEEDS) {
      const r = seeded(seed);

      expect(countSolutions(dig(fill(r), r), 2)).toBe(1);
    }
  });

  test("dig givens are part of the solution", () => {
    for (const seed of SEEDS) {
      const r = seeded(seed);
      const s = fill(r);
      const p = dig(s, r);

      expect(p.every((d, i) => d === 0 || d === s[i])).toBe(true);
      expect(p.some((d) => d === 0)).toBe(true);
    }
  });

  test("dig is symmetric", () => {
    const r = seeded(4);
    const p = dig(fill(r), r);

    for (let i = 0; i < 81; i++) expect(p[i] === 0).toBe(p[80 - i] === 0);
  });
});
