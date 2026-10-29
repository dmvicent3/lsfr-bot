import { describe, expect, test } from "bun:test";
import { adjacentMines, layMines } from "../../../src/modules/minesweeper/field.ts";
import { neighbours } from "../../../src/modules/minesweeper/grid.ts";
import { board, seeded } from "./fixtures.ts";

const BEGINNER = { width: 9, height: 9, mines: 10 };

const mineIndexes = (field: boolean[]) =>
  field.flatMap((mine, i) => (mine ? [i] : []));

describe("layMines", () => {
  for (const center of [40, 0, 4]) {
    test(`exact count and a clear zone around ${center}`, () => {
      const field = layMines(BEGINNER, center, seeded(center + 7));
      const zone = [center, ...neighbours(center, 9, 9)];
      expect(field).toHaveLength(81);
      expect(mineIndexes(field)).toHaveLength(10);
      expect(mineIndexes(field).filter((i) => zone.includes(i))).toEqual([]);
    });
  }

  test("the same seed lays the same field", () => {
    expect(layMines(BEGINNER, 40, seeded(3))).toEqual(layMines(BEGINNER, 40, seeded(3)));
  });

  test("max mines fill every cell outside the zone", () => {
    const field = layMines({ width: 5, height: 5, mines: 16 }, 12, seeded(1));
    const zone = [12, ...neighbours(12, 5, 5)];
    expect(field.map((mine, i) => mine === !zone.includes(i))).not.toContain(false);
  });
});

describe("adjacentMines", () => {
  test("counts touching mines", () => {
    const { field } = board(["*..", ".*.", "..."]);
    expect(adjacentMines(field ?? [], 2, 3, 3)).toBe(1);
    expect(adjacentMines(field ?? [], 4, 3, 3)).toBe(1);
    expect(adjacentMines(field ?? [], 3, 3, 3)).toBe(2);
  });
});
