import { expect, test } from "bun:test";
import { slotsOf } from "../../../../src/modules/crossword/generate/slots.ts";
import { slotsThrough } from "../../../../src/modules/crossword/play/through.ts";
import { col, row, square } from "./fixtures.ts";

test("a cell of the square sits in its row's across and its column's down, across first", () => {
  expect(slotsThrough(square(), 7)).toEqual([row(1), col(2)]);
  expect(slotsThrough(square(), 0)).toEqual([row(0), col(0)]);
});

test("a block, or a cell off the board, is in no slot", () => {
  const blocks = [3, 4, 9, 15, 20, 21];
  const p = { size: 5 as const, blocks, slots: slotsOf(5, blocks), answers: [] };

  expect(slotsThrough(p, 3)).toEqual([]);
  expect(slotsThrough(p, 25)).toEqual([]);
  expect(slotsThrough(p, 2).map((s) => p.slots[s]!.dir)).toEqual(["a", "d"]);
});
