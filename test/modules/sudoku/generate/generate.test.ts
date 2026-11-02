import { describe, expect, test } from "bun:test";
import { countSolutions } from "../../../../src/modules/sudoku/generate/count.ts";
import { generate } from "../../../../src/modules/sudoku/generate/generate.ts";
import { parseGrid } from "../../../../src/modules/sudoku/generate/grid.ts";
import type { Level } from "../../../../src/modules/sudoku/types.ts";
import { seeded } from "../../shed/testing/random.ts";

const LEVELS: Level[] = ["easy", "medium", "hard"];
const SEEDS = [1, 2, 3];

describe("generate", () => {
  for (const level of LEVELS) {
    test(`${level}: right level, one solution, givens match`, () => {
      for (const seed of SEEDS) {
        const out = generate(level, seeded(seed));
        const givens = parseGrid(out.givens);
        const solution = parseGrid(out.solution);

        expect(out.level).toBe(level);
        expect(countSolutions(givens, 2)).toBe(1);
        expect(givens.every((d, i) => d === 0 || d === solution[i])).toBe(true);
      }
    });
  }
});
