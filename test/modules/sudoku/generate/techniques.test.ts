import { describe, expect, test } from "bun:test";
import type { Board } from "../../../../src/modules/sudoku/generate/techniques/types.ts";
import {
  hiddenSingle,
  nakedSingle,
} from "../../../../src/modules/sudoku/generate/techniques/singles.ts";
import { nakedPair } from "../../../../src/modules/sudoku/generate/techniques/pairs.ts";
import { pointing } from "../../../../src/modules/sudoku/generate/techniques/pointing.ts";
import { candidates, parseGrid } from "../../../../src/modules/sudoku/generate/grid.ts";

const ALL = 0b111111111;
const bit = (d: number) => 1 << (d - 1);

function blank(): Board {
  return { cells: Array(81).fill(0), marks: Array(81).fill(ALL) };
}

function fromGrid(text: string): Board {
  const cells = parseGrid(text);
  const marks = cells.map((d, c) => (d === 0 ? candidates(cells, c) : 0));

  return { cells, marks };
}

describe("nakedSingle", () => {
  test("places the only candidate and clears it from peers", () => {
    const b = blank();
    b.marks[0] = bit(7);
    b.marks[1] = bit(7) | bit(2);

    expect(nakedSingle(b)).toBe(true);
    expect(b.cells[0]).toBe(7);
    expect(b.marks[0]).toBe(0);
    expect(b.marks[1]).toBe(bit(2));
    expect(b.marks[80]! & bit(7)).toBe(bit(7));
  });

  test("returns false when no cell has one candidate", () => {
    expect(nakedSingle(blank())).toBe(false);
  });

  test("works on a parsed grid with a single gap", () => {
    const b = fromGrid(
      "034678912672195348198342567859761423426853791713924856961537284287419635345286179",
    );

    expect(nakedSingle(b)).toBe(true);
    expect(b.cells[0]).toBe(5);
  });
});

describe("hiddenSingle", () => {
  test("places a digit that fits one cell of a row", () => {
    const b = blank();

    for (let c = 0; c < 9; c++) if (c !== 3) b.marks[c]! &= ~bit(5);

    expect(hiddenSingle(b)).toBe(true);
    expect(b.cells[3]).toBe(5);
  });

  test("returns false on a blank board", () => {
    expect(hiddenSingle(blank())).toBe(false);
  });
});

describe("nakedPair", () => {
  test("removes the pair digits from the rest of the unit", () => {
    const b = blank();
    b.marks[0] = bit(1) | bit(2);
    b.marks[1] = bit(1) | bit(2);

    expect(nakedPair(b)).toBe(true);
    expect(b.marks[0]).toBe(bit(1) | bit(2));
    expect(b.marks[5]! & (bit(1) | bit(2))).toBe(0);
    expect(b.marks[5]).toBe(ALL & ~(bit(1) | bit(2)));
  });

  test("returns false with nothing to remove", () => {
    expect(nakedPair(blank())).toBe(false);
  });
});

describe("pointing", () => {
  test("removes the digit from the row outside the box", () => {
    const b = blank();

    for (const c of [9, 10, 11, 18, 19, 20]) b.marks[c]! &= ~bit(4);

    expect(pointing(b)).toBe(true);

    // box 0: digit 4 only in row 0 (cells 0-2) -> gone from 3..8
    for (let c = 3; c < 9; c++) expect(b.marks[c]! & bit(4)).toBe(0);

    expect(b.marks[0]! & bit(4)).toBe(bit(4));
  });

  test("removes the digit from the column outside the box", () => {
    const b = blank();

    for (const c of [1, 2, 10, 11, 19, 20]) b.marks[c]! &= ~bit(6);

    expect(pointing(b)).toBe(true);
    expect(b.marks[27]! & bit(6)).toBe(0);
    expect(b.marks[72]! & bit(6)).toBe(0);
    expect(b.marks[0]! & bit(6)).toBe(bit(6));
  });

  test("returns false on a blank board", () => {
    expect(pointing(blank())).toBe(false);
  });
});
