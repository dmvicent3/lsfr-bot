import { describe, expect, test } from "bun:test";
import { emptyBoard } from "../../../src/modules/tictactoe/board.ts";
import { candidates } from "../../../src/modules/tictactoe/candidates.ts";
import { losingSquares } from "../../../src/modules/tictactoe/search.ts";
import { board } from "./fixtures.ts";

describe("losingSquares", () => {
  test("nothing loses from an empty board", () => {
    expect(losingSquares(emptyBoard(), "X")).toEqual([]);
  });

  test("against a corner opening only the centre holds", () => {
    expect(losingSquares(board("X--------"), "O")).toEqual([1, 2, 3, 5, 6, 7, 8]);
  });

  test("against a centre opening the edges lose", () => {
    expect(losingSquares(board("----X----"), "O")).toEqual([1, 3, 5, 7]);
  });

  test("a square that lets the other side fork loses", () => {
    // X has opposite corners; a corner reply lets X fork, an edge holds.
    expect(losingSquares(board("X---O---X"), "O")).toEqual([2, 6]);
  });
});

describe("candidates", () => {
  test("easy offers every empty square, even past a win", () => {
    expect(candidates(board("OO-XX----"), "X", "easy")).toEqual({
      squares: [2, 5, 6, 7, 8],
      forced: false,
    });
  });

  test("normal and hard play the win or block", () => {
    expect(candidates(board("X-O-X----"), "O", "normal")).toEqual({ squares: [8], forced: true });
    expect(candidates(board("X-O-X----"), "O", "hard")).toEqual({ squares: [8], forced: true });
  });

  test("normal offers every square when nothing is forced", () => {
    expect(candidates(board("X--------"), "O", "normal").squares).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  test("hard keeps only the squares that do not lose", () => {
    expect(candidates(board("X--------"), "O", "hard")).toEqual({ squares: [4], forced: false });
  });

  test("hard keeps every square when all of them lose", () => {
    // O has already lost: nothing to block yet, but X forks whatever O does.
    const b = board("OX-O-XX--");
    expect(candidates(b, "O", "hard").squares).toEqual([2, 4, 7, 8]);
  });
});
