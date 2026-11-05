import { expect, test } from "bun:test";
import {
  filledSlots,
  solvedSlots,
  isCorrect,
  isFull,
  isRevealed,
  slotText,
  solutionOf,
  wrongOrEmpty,
} from "../../../../src/modules/crossword/play/cells.ts";
import { row, square } from "./fixtures.ts";

const SOL = solutionOf(square());
const at = (cells: string, i: number, ch: string) => cells.slice(0, i) + ch + cells.slice(i + 1);

test("isFull: no empty cell", () => {
  expect(isFull(SOL)).toBe(true);
  expect(isFull(at(SOL, 3, "."))).toBe(false);
});

test("isCorrect: every white cell matches, case-insensitive; blocks ignored", () => {
  expect(isCorrect(square(), SOL)).toBe(true);
  expect(isCorrect(square(), SOL.toUpperCase())).toBe(true);
  expect(isCorrect(square(), at(SOL, 0, "x"))).toBe(false);
  expect(isCorrect(square(), at(SOL, 0, "."))).toBe(false);

  const p = { ...square(), blocks: [0] };
  expect(isCorrect(p, at(SOL, 0, "#"))).toBe(true);
});

test("wrongOrEmpty: indices of empty or wrong white cells", () => {
  const cells = at(at(SOL, 2, "."), 7, "Z");

  expect(wrongOrEmpty(square(), cells)).toEqual([2, 7]);
  expect(wrongOrEmpty(square(), at(SOL, 4, "E"))).toEqual([]);
});

test("filledSlots: a slot with no empty cell is filled, right or wrong", () => {
  const cells = `zzzzz${".".repeat(20)}`;
  const filled = filledSlots(square(), cells);

  expect(filled[row(0)]).toBe(true);
  expect(filled.filter(Boolean)).toHaveLength(1);
});

test("solvedSlots: every letter right, typed or revealed; a wrong or empty cell is not", () => {
  const solved = solvedSlots(square(), at(at(SOL, 0, "C"), 6, "z"));

  expect(solved[row(0)]).toBe(true);
  expect(solved[row(1)]).toBe(false);
  expect(solvedSlots(square(), `crane${".".repeat(20)}`).filter(Boolean)).toHaveLength(1);
});

test("slotText: uppercase letters, dots kept", () => {
  const slot = square().slots[row(0)]!;

  expect(slotText(`cR.ne${".".repeat(20)}`, slot)).toBe("CR.NE");
});

test("isRevealed: only an uppercase letter", () => {
  expect(["A", "a", ".", "#", undefined].map(isRevealed)).toEqual([
    true,
    false,
    false,
    false,
    false,
  ]);
});
