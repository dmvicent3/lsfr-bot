import { describe, expect, test } from "bun:test";
import {
  ABANDON_MS,
  isAbandoned,
  isStale,
  jevosMove,
  jevosToMove,
  playerMove,
  startGame,
} from "../../../src/modules/tictactoe/game.ts";
import type { Game } from "../../../src/modules/tictactoe/types.ts";
import { board } from "./fixtures.ts";

const NOW = 1_000_000;
const start = (r: number) =>
  startGame({ guildId: "g", channelId: "c", playerId: "u", now: NOW, random: () => r });
const game = (cells: string, jevosMark: "X" | "O" = "O"): Game => ({
  ...start(0.7),
  board: board(cells),
  jevosMark,
});

describe("startGame", () => {
  test("a low coin makes jevos X, moving first", () => {
    const g = start(0.2);
    expect(g.jevosMark).toBe("X");
    expect(jevosToMove(g)).toBe(true);
    expect(g.messageId).toBeNull();
  });

  test("a high coin makes the player X", () => {
    const g = start(0.7);
    expect(g.jevosMark).toBe("O");
    expect(jevosToMove(g)).toBe(false);
  });
});

describe("playerMove", () => {
  test("a taken square is refused", () => {
    expect(playerMove(game("X--------", "X"), 0, NOW)).toEqual({ error: "taken" });
  });

  test("jevos's turn is refused", () => {
    expect(playerMove(game("X--------", "O"), 4, NOW)).toEqual({ error: "not-your-turn" });
  });

  test("a finished game is refused", () => {
    expect(playerMove(game("XXXOO----", "O"), 5, NOW)).toEqual({ error: "over" });
  });

  test("the player completing a line wins", () => {
    const moved = playerMove(game("XX-OO----"), 2, NOW + 5);
    expect(moved).toMatchObject({
      outcome: { kind: "win", winner: "player", line: [0, 1, 2] },
      game: { updatedAt: NOW + 5 },
    });
  });

  test("an ordinary move keeps the game going", () => {
    expect(playerMove(game("---------"), 4, NOW)).toMatchObject({ outcome: { kind: "playing" } });
  });
});

describe("jevosMove", () => {
  test("jevos completing a line wins", () => {
    expect(jevosMove(game("XX-OO-X--"), 5, NOW).outcome).toEqual({
      kind: "win",
      winner: "jevos",
      line: [3, 4, 5],
    });
  });

  test("filling the board without a line is a draw", () => {
    expect(jevosMove(game("XOXXOOOX-", "X"), 8, NOW).outcome).toEqual({ kind: "draw" });
  });
});

describe("isAbandoned", () => {
  test("after 10 minutes without a move", () => {
    const g = start(0.7);
    expect(ABANDON_MS).toBe(600_000);
    expect(isAbandoned(g, NOW + 599_999)).toBe(false);
    expect(isAbandoned(g, NOW + 600_000)).toBe(true);
  });
});

describe("isStale", () => {
  test("a game idle for 10 minutes is stale", () => {
    expect(isStale(game("X--------", "X"), NOW + ABANDON_MS, false)).toBe(true);
  });

  test("jevos's turn with nobody thinking means a restart lost the move", () => {
    expect(isStale(game("X--------", "O"), NOW, false)).toBe(true);
    expect(isStale(game("X--------", "O"), NOW, true)).toBe(false);
  });

  test("the player's turn, recently, is live", () => {
    expect(isStale(game("X---O----", "O"), NOW, false)).toBe(false);
  });
});
