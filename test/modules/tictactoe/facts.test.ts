import { describe, expect, test } from "bun:test";
import { emptyBoard } from "../../../src/modules/tictactoe/board.ts";
import { squareFacts } from "../../../src/modules/tictactoe/facts.ts";
import { board } from "./fixtures.ts";

describe("squareFacts", () => {
  test("a block that leaves X a fork, worded as jevos was probed with", () => {
    expect(squareFacts(board("X-O-X----"), "O", 8)).toBe(
      "Square 9 (bottom-right, a corner)\n" +
        "- Taking it gives O three in a row now: no\n" +
        "- Taking it stops X's three in a row next turn: yes\n" +
        "- Taking it gives O two ways to win next turn: no\n" +
        "- After it, X can win on their next move: no\n" +
        "- After it, X can make two ways to win: yes",
    );
  });

  test("not blocking leaves X a win", () => {
    expect(squareFacts(board("X-O-X----"), "O", 3)).toContain(
      "After it, X can win on their next move: yes",
    );
  });

  test("a winning square leaves the opponent nothing", () => {
    const facts = squareFacts(board("XX-OO----"), "X", 2);
    expect(facts).toContain("Taking it gives X three in a row now: yes");
    expect(facts).toContain("After it, O can win on their next move: no");
    expect(facts).toContain("After it, O can make two ways to win: no");
  });

  test("a fork is two ways to win", () => {
    expect(squareFacts(board("X---O---X"), "X", 2)).toContain(
      "Taking it gives X two ways to win next turn: yes",
    );
  });

  test("the centre of an empty board", () => {
    expect(squareFacts(emptyBoard(), "X", 4)).toStartWith("Square 5 (centre, a centre)\n");
  });
});
