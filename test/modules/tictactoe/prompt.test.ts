import { describe, expect, test } from "bun:test";
import { emptyBoard } from "../../../src/modules/tictactoe/board.ts";
import { evidence, questions } from "../../../src/modules/tictactoe/prompt.ts";
import { board } from "./fixtures.ts";

const MID_GAME = board("X-O-X----");

describe("evidence", () => {
  test("the board, then a facts block per empty square", () => {
    const e = evidence(MID_GAME, "O");
    expect(e).toStartWith(
      "Tic-tac-toe board (squares 1-9, left to right, top to bottom; a number means the square is empty):\n" +
        "X | 2 | O\n" +
        "4 | X | 6\n" +
        "7 | 8 | 9\n" +
        "X has squares: 1, 5. O has squares: 3.\n" +
        "It is O's turn. Three in a row (row, column or diagonal) wins.\n" +
        "\n" +
        "Facts per empty square:\n" +
        "Square 2 (top-middle, a edge)\n",
    );
    expect(e.match(/^Square \d/gm)).toHaveLength(6);
    expect(e).toContain("can make two ways to win: yes\nSquare 4 (middle-left, a edge)");
  });

  test("an empty board has no squares yet and fits jevos's 4,000 characters", () => {
    const e = evidence(emptyBoard(), "X");
    expect(e).toContain("X has squares: none. O has squares: none.");
    expect(e.length).toBeLessThan(4000);
  });
});

describe("questions", () => {
  test("one per empty square, keyed by its number", () => {
    const qs = questions(MID_GAME, "O");
    expect(qs.map((q) => q.key)).toEqual(["2", "4", "6", "7", "8", "9"]);
    expect(qs.at(-1)?.instructions).toBe(
      "Should O take square 9? Use the facts: winning now beats everything, then stopping X's win, then making two ways to win; never leave X a win.",
    );
  });
});
