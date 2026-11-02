import { describe, expect, test } from "bun:test";
import { grade } from "../../../../src/modules/sudoku/generate/grade.ts";
import { parseGrid } from "../../../../src/modules/sudoku/generate/grid.ts";
import { EASY, HARD, MEDIUM } from "../fixtures.ts";

describe("grade", () => {
  test("a singles-only puzzle is easy", () => {
    expect(grade(parseGrid(EASY))).toBe("easy");
  });

  test("a puzzle needing pairs or pointing is medium", () => {
    expect(grade(parseGrid(MEDIUM))).toBe("medium");
  });

  test("a puzzle beyond those techniques is hard", () => {
    expect(grade(parseGrid(HARD))).toBe("hard");
  });
});
