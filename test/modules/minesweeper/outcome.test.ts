import { describe, expect, test } from "bun:test";
import { elapsedSeconds, isWon } from "../../../src/modules/minesweeper/outcome.ts";
import { board } from "./fixtures.ts";

const won = (rows: string[]) => {
  const b = board(rows);

  return isWon(b.field ?? [], b.cells);
};

describe("isWon", () => {
  test("won when only mines are left hidden or flagged", () => {
    expect(won(["*oo", "ooo", "ooF"])).toBe(true);
  });

  test("not won while a safe cell is hidden", () => {
    expect(won(["*oo", "o.o", "ooo"])).toBe(false);
  });

  test("not won while a safe cell is flagged", () => {
    expect(won(["*oo", "ofo", "ooo"])).toBe(false);
  });
});

describe("elapsedSeconds", () => {
  test("whole seconds since the start", () => {
    expect(elapsedSeconds(1_000, 62_999)).toBe(61);
  });

  test("zero before the first reveal", () => {
    expect(elapsedSeconds(null, 5)).toBe(0);
  });
});
