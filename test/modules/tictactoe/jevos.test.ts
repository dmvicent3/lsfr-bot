import { describe, expect, test } from "bun:test";
import { JevError } from "../../../src/core/jev/http.ts";
import type { Jev, YesNoOptions } from "../../../src/core/jev/types.ts";
import { askJevos, jevosTurn } from "../../../src/modules/tictactoe/jevos.ts";
import type { Game } from "../../../src/modules/tictactoe/types.ts";
import { board } from "./fixtures.ts";

const MID_GAME = board("X-O-X----");

describe("askJevos", () => {
  test("asks about every empty square with room for the facts, and plays the top one", async () => {
    let opts: YesNoOptions | undefined;
    let asked: string[] = [];
    const jev: Jev = {
      async yesNo(_state, questions, o) {
        opts = o;
        asked = questions.map((q) => q.key);

        return new Map(asked.map((k) => [k, k === "9" ? 0.9 : 0.1]));
      },
    };
    expect((await askJevos(jev, MID_GAME, () => 0)).square).toBe(8);
    expect(asked).toEqual(["2", "4", "6", "7", "8", "9"]);
    expect(opts).toEqual({ maxState: 4000 });
  });

  test("guesses when jev fails", async () => {
    const jev: Jev = {
      yesNo: async () => {
        throw new JevError("jev is paused after a failure");
      },
    };
    const p = await askJevos(jev, MID_GAME, () => 0);
    expect(p.share).toBeNull();
    expect(MID_GAME[p.square]).toBeNull();
  });

  test("other errors are not swallowed", async () => {
    const jev: Jev = {
      yesNo: async () => {
        throw new TypeError("bug");
      },
    };
    const err: unknown = await askJevos(jev, MID_GAME, () => 0).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(TypeError);
  });
});

const game = (cells: string): Game => ({
  guildId: "g",
  channelId: "c",
  messageId: "m",
  playerId: "u",
  board: board(cells),
  jevosMark: "O",
  updatedAt: 0,
});

describe("jevosTurn", () => {
  test("a move that wins ends the game", async () => {
    const jev: Jev = {
      yesNo: async (_s, qs) => new Map(qs.map((q) => [q.key, q.key === "6" ? 0.9 : 0.1])),
    };
    const { moved, last } = await jevosTurn(jev, game("XX-OO-X--"), () => 0, 5);
    expect(last.square).toBe(5);
    expect(moved.outcome).toEqual({ kind: "win", winner: "jevos", line: [3, 4, 5] });
    expect(moved.game.updatedAt).toBe(5);
  });

  test("with jev down jevos still moves", async () => {
    const jev: Jev = {
      yesNo: async () => {
        throw new JevError("jev unreachable: refused");
      },
    };
    const { moved, last } = await jevosTurn(jev, game("X--------"), () => 0, 5);
    expect(last.share).toBeNull();
    expect(moved.game.board.filter((c) => c === "O")).toHaveLength(1);
    expect(moved.outcome).toEqual({ kind: "playing" });
  });
});
