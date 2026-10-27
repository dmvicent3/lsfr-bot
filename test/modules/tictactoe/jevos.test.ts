import { describe, expect, test } from "bun:test";
import { JevError } from "../../../src/core/jev/http.ts";
import type { Jev, YesNoOptions } from "../../../src/core/jev/types.ts";
import { askJevos } from "../../../src/modules/tictactoe/jevos.ts";
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
