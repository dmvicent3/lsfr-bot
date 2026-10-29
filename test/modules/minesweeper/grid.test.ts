import { describe, expect, test } from "bun:test";
import {
  colOf,
  columnLetter,
  neighbours,
  rowOf,
  toIndex,
} from "../../../src/modules/minesweeper/grid.ts";

describe("grid", () => {
  test("a corner has three neighbours", () => {
    expect(neighbours(0, 5, 5)).toEqual([1, 5, 6]);
  });

  test("an inner cell has eight neighbours, ascending", () => {
    expect(neighbours(12, 5, 5)).toEqual([6, 7, 8, 11, 13, 16, 17, 18]);
  });

  test("the last cell has three neighbours", () => {
    expect(neighbours(24, 5, 5)).toEqual([18, 19, 23]);
  });

  test("neighbours stay on a non-square board", () => {
    expect(neighbours(4, 5, 3)).toEqual([3, 8, 9]);
  });

  test("index and column/row convert both ways", () => {
    expect(colOf(37, 9)).toBe(1);
    expect(rowOf(37, 9)).toBe(4);
    expect(toIndex(colOf(37, 9), rowOf(37, 9), 9)).toBe(37);
  });

  test("columns are letters", () => {
    expect(columnLetter(0)).toBe("A");
    expect(columnLetter(19)).toBe("T");
  });
});
