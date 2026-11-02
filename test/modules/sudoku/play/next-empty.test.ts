import { expect, test } from "bun:test";
import { nextEmpty } from "../../../../src/modules/sudoku/play/next-empty.ts";
import { setAt } from "./game.ts";

const FULL = "1".repeat(81);

test("next zero after from", () => {
  expect(nextEmpty(setAt(FULL, 5, "0"), 0)).toBe(5);
});

test("wraps past the end", () => {
  expect(nextEmpty(setAt(FULL, 3, "0"), 80)).toBe(3);
});

test("from when none are empty", () => {
  expect(nextEmpty(FULL, 7)).toBe(7);
});

test("the only empty cell is from itself", () => {
  expect(nextEmpty(setAt(FULL, 7, "0"), 7)).toBe(7);
});
