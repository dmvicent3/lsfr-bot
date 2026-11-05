import { expect, test } from "bun:test";
import { groupOf, unsolved, wordOf } from "../../../../src/modules/groups/play/words.ts";
import { PUZZLE } from "./fixtures.ts";

test("word 4g+k is group g's k-th word", () => {
  expect(groupOf(6)).toBe(1);
  expect(wordOf(PUZZLE, 6)).toBe("ash");
  expect(wordOf(PUZZLE, 15)).toBe("whist");
});

test("unsolved keeps the order and drops found groups", () => {
  expect(unsolved("f0e1d2c3b4a59687", "03")).toEqual([11, 4, 10, 5, 9, 6, 8, 7]);
});
