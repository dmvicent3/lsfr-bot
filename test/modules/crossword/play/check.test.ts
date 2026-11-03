import { expect, test } from "bun:test";
import { solutionOf } from "../../../../src/modules/crossword/play/cells.ts";
import { checkLine, verdict } from "../../../../src/modules/crossword/play/check.ts";
import { square, state } from "./fixtures.ts";

const SOL = solutionOf(square());

test("a grid with an empty cell is incomplete", () => {
  expect(verdict(state())).toBe("incomplete");
  expect(verdict(state({ cells: `${SOL.slice(0, 24)}.` }))).toBe("incomplete");
});

test("a full grid is correct or wrong, revealed letters counting as right", () => {
  expect(verdict(state({ cells: SOL }))).toBe("correct");
  expect(verdict(state({ cells: `C${SOL.slice(1)}` }))).toBe("correct");
  expect(verdict(state({ cells: `z${SOL.slice(1)}` }))).toBe("wrong");
});

test("the failed-check line shows the cost on a daily only", () => {
  expect(checkLine(true)).toBe("❌ Not quite — some letters are wrong (−10)");
  expect(checkLine(false)).toBe("❌ Not quite — some letters are wrong");
});
