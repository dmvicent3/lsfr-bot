import { describe, expect, test } from "bun:test";
import { countSolutions } from "../../../../src/modules/sudoku/generate/count.ts";
import { gridText, parseGrid, PEERS, UNITS } from "../../../../src/modules/sudoku/generate/grid.ts";
import { EASY, HARD, SOLVED } from "../fixtures.ts";

describe("countSolutions", () => {
  test("empty grid stops at the limit", () => {
    expect(countSolutions(Array(81).fill(0), 2)).toBe(2);
  });

  test("solved grid has one", () => {
    expect(countSolutions(parseGrid(SOLVED), 2)).toBe(1);
  });

  test("conflicting grid has none", () => {
    const g = Array(81).fill(0);
    g[0] = 5;
    g[1] = 5;
    expect(countSolutions(g, 2)).toBe(0);
  });

  test("published puzzle has one", () => {
    expect(countSolutions(parseGrid(HARD), 2)).toBe(1);
  });
});

describe("grid helpers", () => {
  test("parseGrid round-trips", () => {
    expect(gridText(parseGrid(EASY))).toBe(EASY);
  });

  test("PEERS has 20 per cell and no self", () => {
    expect(PEERS).toHaveLength(81);
    PEERS.forEach((p, c) => {
      expect(p).toHaveLength(20);
      expect(p).not.toContain(c);
    });
    expect(UNITS).toHaveLength(27);
  });
});
