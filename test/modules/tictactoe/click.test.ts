import { describe, expect, test } from "bun:test";
import { clickVerdict } from "../../../src/modules/tictactoe/click.ts";
import type { Game } from "../../../src/modules/tictactoe/types.ts";
import { board } from "./fixtures.ts";

const GAME: Game = {
  guildId: "g",
  channelId: "c",
  messageId: "m",
  playerId: "u1",
  board: board("---------"),
  jevosMark: "O",
  updatedAt: 0,
};

describe("clickVerdict", () => {
  test("the player on the live board may play", () => {
    expect(clickVerdict(GAME, { messageId: "m", userId: "u1" })).toBe("play");
  });

  test("anyone else is told it is not theirs", () => {
    expect(clickVerdict(GAME, { messageId: "m", userId: "u2" })).toBe("not-yours");
  });

  test("an old board, or no game at all, is over", () => {
    expect(clickVerdict(GAME, { messageId: "old", userId: "u1" })).toBe("over");
    expect(clickVerdict(null, { messageId: "m", userId: "u1" })).toBe("over");
  });
});
