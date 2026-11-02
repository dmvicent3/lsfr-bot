import { describe, expect, test } from "bun:test";
import { fill } from "../../../../src/modules/sudoku/generate/fill.ts";
import { gridText, UNITS } from "../../../../src/modules/sudoku/generate/grid.ts";
import { seeded } from "../../shed/testing/random.ts";

describe("fill", () => {
  test("fill makes a valid complete grid", () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const g = fill(seeded(seed));

      for (const unit of UNITS) {
        expect(unit.map((c) => g[c]).toSorted((a, b) => a! - b!)).toEqual([
          1, 2, 3, 4, 5, 6, 7, 8, 9,
        ]);
      }
    }
  });

  test("fill is repeatable for a seed", () => {
    expect(gridText(fill(seeded(7)))).toBe(gridText(fill(seeded(7))));
    expect(gridText(fill(seeded(7)))).not.toBe(gridText(fill(seeded(8))));
  });
});
