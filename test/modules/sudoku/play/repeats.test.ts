import { expect, test } from "bun:test";
import { doneDigits } from "../../../../src/modules/sudoku/play/done-digits.ts";
import { repeats } from "../../../../src/modules/sudoku/play/repeats.ts";
import { EASY_SOLUTION } from "../fixtures.ts";

const EMPTY = "0".repeat(81);
const put = (cells: string, at: Record<number, string>): string =>
  Array.from(cells, (c, i) => at[i] ?? c).join("");

test("a solved board has no repeats", () => {
  expect(repeats(EASY_SOLUTION).size).toBe(0);
});

test("the same digit in a row, column or box marks both cells", () => {
  expect(repeats(put(EMPTY, { 0: "5", 8: "5" }))).toEqual(new Set([0, 8]));
  expect(repeats(put(EMPTY, { 0: "5", 72: "5" }))).toEqual(new Set([0, 72]));
  expect(repeats(put(EMPTY, { 0: "5", 20: "5" }))).toEqual(new Set([0, 20]));
});

test("the same digit outside each other's row, column and box is fine", () => {
  expect(repeats(put(EMPTY, { 0: "5", 13: "5", 40: "4" })).size).toBe(0);
});

test("a digit placed nine times is done; eight is not", () => {
  expect(doneDigits(EASY_SOLUTION)).toEqual(new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]));

  const firstFive = EASY_SOLUTION.indexOf("5");
  expect(doneDigits(put(EASY_SOLUTION, { [firstFive]: "0" })).has(5)).toBe(false);
  expect(doneDigits(EMPTY).size).toBe(0);
});
