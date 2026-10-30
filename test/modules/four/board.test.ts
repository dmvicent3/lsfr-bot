import { expect, test } from "bun:test";
import {
  discCount,
  drop,
  emptyBoard,
  fromBoard,
  isFull,
  landingRow,
  legalColumns,
  toBoard,
  winLine,
  winnerOf,
  winningColumns,
} from "../../../src/modules/four/board.ts";
import { board } from "./fixtures.ts";

test("discs drop to the lowest empty cell", () => {
  const once = drop(emptyBoard(), 3, "R");
  expect(once[38]).toBe("R");
  expect(drop(once, 3, "Y")[31]).toBe("Y");
  expect(landingRow(once, 3)).toBe(4);
});

test("a full column has no landing row and is not legal", () => {
  const b = board(["R......", "Y......", "R......", "Y......", "R......", "Y......"]);
  expect(landingRow(b, 0)).toBeNull();
  expect(legalColumns(b)).toEqual([1, 2, 3, 4, 5, 6]);
});

test("four in a row across, up and on both diagonals", () => {
  expect(winLine(board(["RRRR..."]))).toEqual([35, 36, 37, 38]);
  expect(winLine(board(["R......", "R......", "R......", "R......"]))).toEqual([14, 21, 28, 35]);
  expect(winLine(board(["...Y...", "..YR...", ".YRR...", "YRRR..."]))).toEqual([17, 23, 29, 35]);
  expect(winLine(board(["Y......", "RY.....", "RRY....", "RRRY..."]))).toEqual([14, 22, 30, 38]);
  expect(winLine(board(["RRR...."]))).toBeNull();
  expect(winnerOf(board(["YYYY..."]))).toBe("Y");
  expect(winnerOf(board(["YYY...."]))).toBeNull();
});

test("a full board with no four is full and has no winner", () => {
  const b = board(["RRYYRRY", "YYRRYYR", "RRYYRRY", "YYRRYYR", "RRYYRRY", "YYRRYYR"]);
  expect(isFull(b)).toBe(true);
  expect(winLine(b)).toBeNull();
  expect(isFull(emptyBoard())).toBe(false);
});

test("winning columns are the legal drops that make four", () => {
  expect(winningColumns(board(["RRR.YY."]), "R")).toEqual([3]);
  expect(winningColumns(board(["RRR.YY."]), "Y")).toEqual([]);
});

test("the board round-trips through its text and counts discs", () => {
  const b = board(["..Y....", "RRR.YY."]);
  expect(toBoard(fromBoard(b))).toEqual(b);
  expect(discCount(b, "R")).toBe(3);
  expect(discCount(b, "Y")).toBe(3);
});
