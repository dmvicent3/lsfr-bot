import { expect, test } from "bun:test";
import { bbbv } from "../../../../src/modules/minesweeper/daily/bbbv.ts";
import { zeroFlood } from "../../../../src/modules/minesweeper/daily/flood.ts";
import { board } from "../fixtures.ts";

const count = (rows: string[]): number => {
  const b = board(rows);

  return bbbv(b.field ?? [], b.cells, b.width, b.height);
};

test("one corner mine: the rest is one zero region, so 3BV is 1", () => {
  expect(count(["*....", ".....", ".....", ".....", "....."])).toBe(1);
});

test("an already open region doesn't count", () => {
  expect(count(["*oooo", "ooooo", "ooooo", "ooooo", "ooooo"])).toBe(0);
});

test("a number with no zero beside it counts on its own", () => {
  // the middle column is all numbers between two mine columns, no zeros anywhere
  expect(count(["*.*", "*.*", "*.*"])).toBe(3);
});

test("a wall of mines splits the board into two zero regions", () => {
  expect(count([".....*.....", ".....*.....", ".....*....."])).toBe(2);
});

test("zeroFlood opens the zeros and their numbered border", () => {
  const b = board(["*....", ".....", "....."]);
  const open = zeroFlood(b.field ?? [], 4, b.width, b.height);
  expect(open).not.toContain(0);
  expect(open).toHaveLength(14);
});
