import { expect, test } from "bun:test";
import { slotsOf } from "../../../../src/modules/crossword/generate/slots.ts";

test("numbering and order on a 5x5 with two corners blocked", () => {
  // # . . . .      1 2 3 4 5     (cell 0 and 24 black)
  // . . . . .      6 . . . .
  // . . . . .      7 . . . .
  // . . . . .      8 . . . .
  // . . . . #
  const slots = slotsOf(5, [0, 24]).map((s) => `${s.n}${s.dir}${s.cells.length}`);

  expect(slots).toEqual(["1a4", "5a5", "6a5", "7a5", "8a4", "1d5", "2d5", "3d5", "4d4", "5d4"]);
});

test("cells of a slot", () => {
  const s = slotsOf(5, [0, 24]);

  expect(s[0]!.cells).toEqual([1, 2, 3, 4]);
  expect(s.find((x) => x.n === 2 && x.dir === "d")?.cells).toEqual([2, 7, 12, 17, 22]);
});
