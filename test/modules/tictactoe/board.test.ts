import { describe, expect, test } from "bun:test";
import {
  emptyBoard,
  emptySquares,
  place,
  squareKind,
  turnOf,
  winningLine,
  winsFor,
} from "../../../src/modules/tictactoe/board.ts";
import { board } from "./fixtures.ts";

describe("board", () => {
  test("a diagonal of X is a winning line", () => {
    expect(winningLine(board("XO-OX---X"))).toEqual([0, 4, 8]);
  });

  test("a full board with no line has no winning line", () => {
    expect(winningLine(board("XOXXOOOXX"))).toBeNull();
  });

  test("O moves after one X", () => {
    expect(turnOf(board("X--------"))).toBe("O");
    expect(turnOf(emptyBoard())).toBe("X");
  });

  test("winsFor lists the squares that complete three", () => {
    expect(winsFor(board("XX-OO----"), "X")).toEqual([2]);
    expect(winsFor(board("XX-OO----"), "O")).toEqual([5]);
  });

  test("place returns a new board and leaves the old one", () => {
    const before = emptyBoard();
    const after = place(before, 4, "X");
    expect(after[4]).toBe("X");
    expect(before[4]).toBeNull();
    expect(emptySquares(after)).toEqual([0, 1, 2, 3, 5, 6, 7, 8]);
  });

  test("squares are a centre, corners or edges", () => {
    expect(squareKind(4)).toBe("centre");
    expect(squareKind(0)).toBe("corner");
    expect(squareKind(1)).toBe("edge");
  });
});
