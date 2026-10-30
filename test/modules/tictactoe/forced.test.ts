import { describe, expect, test } from "bun:test";
import { forcedSquares } from "../../../src/modules/tictactoe/forced.ts";
import { board } from "./fixtures.ts";

describe("forcedSquares", () => {
  test("a win comes before a block", () => {
    expect(forcedSquares(board("OO-XX----"), "X")).toEqual([5]);
  });

  test("the square that stops the other side's three in a row", () => {
    expect(forcedSquares(board("X-O-X----"), "O")).toEqual([8]);
  });

  test("every block when the other side has two ways to win", () => {
    expect(forcedSquares(board("XX-XO---O"), "O")).toEqual([2, 6]);
  });

  test("nothing when no line is one move from done", () => {
    expect(forcedSquares(board("X---O----"), "X")).toEqual([]);
  });
});
