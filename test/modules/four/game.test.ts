import { expect, test } from "bun:test";
import {
  ABANDON_MS,
  isStale,
  jevosToMove,
  outcomeOf,
  playerDrop,
  playerMoves,
  startGame,
} from "../../../src/modules/four/game.ts";
import type { Board, Game } from "../../../src/modules/four/types.ts";
import { board } from "./fixtures.ts";

const fresh = (random: number): Game =>
  startGame({
    guildId: "g",
    channelId: "c",
    playerId: "u",
    difficulty: "hard",
    now: 1,
    random: () => random,
  });

const at = (b: Board, first: Game["first"] = "player"): Game => ({
  ...fresh(0.6),
  board: b,
  first,
});

test("a coin flip decides who drops first", () => {
  expect(fresh(0.4).first).toBe("jevos");
  expect(jevosToMove(fresh(0.4))).toBe(true);
  expect(fresh(0.6).first).toBe("player");
  expect(jevosToMove(fresh(0.6))).toBe(false);
  expect(fresh(0.6)).toMatchObject({ difficulty: "hard", messageId: null, startedAt: 1 });
});

test("turns alternate from whoever went first", () => {
  expect(jevosToMove(at(board(["R......"])))).toBe(true);
  expect(jevosToMove(at(board(["RY....."])))).toBe(false);
  expect(jevosToMove(at(board(["Y......"]), "jevos"))).toBe(false);
});

test("the player's drop is refused on a full column, on jevos's turn and after the end", () => {
  const full = at(board(["R......", "Y......", "R......", "Y......", "R......", "Y......"]));
  expect(playerDrop(full, 0, 2)).toEqual({ error: "full" });
  expect(playerDrop(at(board(["R......"])), 1, 2)).toEqual({ error: "not-your-turn" });
  expect(playerDrop(at(board(["YYYY...", "RRR.R.."])), 6, 2)).toEqual({ error: "over" });
});

test("a winning drop ends the game with its line", () => {
  const moved = playerDrop(at(board(["RRR.YYY"])), 3, 9);
  expect(moved).toMatchObject({
    outcome: { kind: "win", winner: "player", line: [35, 36, 37, 38] },
    game: { updatedAt: 9 },
  });
});

test("a full board with no four is a draw", () => {
  const b = board(["RRYYRRY", "YYRRYYR", "RRYYRRY", "YYRRYYR", "RRYYRRY", "YYRRYYR"]);
  expect(outcomeOf(at(b))).toEqual({ kind: "draw" });
  expect(outcomeOf(at(board([])))).toEqual({ kind: "playing" });
});

test("stale after 10 idle minutes, or waiting on a jevos move nobody is making", () => {
  const g = at(board([]));
  expect(isStale(g, 1 + ABANDON_MS, false)).toBe(true);
  expect(isStale(g, 2, false)).toBe(false);
  const jevosTurn = at(board(["R......"]));
  expect(isStale(jevosTurn, 2, false)).toBe(true);
  expect(isStale(jevosTurn, 2, true)).toBe(false);
});

test("the player's moves are their discs", () => {
  expect(playerMoves(at(board(["RYR.Y.."])))).toBe(2);
});
