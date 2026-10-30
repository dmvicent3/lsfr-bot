import { describe, expect, test } from "bun:test";
import { JevError } from "../../../src/core/jev/http.ts";
import type { Jev, YesNoOptions } from "../../../src/core/jev/types.ts";
import { emptyBoard, legalColumns } from "../../../src/modules/four/board.ts";
import { MAX_STATE, askJevos, jevosTurn } from "../../../src/modules/four/jevos.ts";
import { guess, pick } from "../../../src/modules/four/pick.ts";
import { evidence, questions } from "../../../src/modules/four/prompt.ts";
import type { Board, Difficulty, Game } from "../../../src/modules/four/types.ts";
import { board } from "./fixtures.ts";

const game = (b: Board, difficulty: Difficulty): Game => ({
  guildId: "g",
  playerId: "u",
  channelId: "c",
  messageId: "m",
  board: b,
  first: "player",
  difficulty,
  startedAt: 0,
  updatedAt: 0,
});

/** Records the keys asked and says yes to `yes`. */
function recorder(yes: string) {
  const seen: { keys: string[]; opts: YesNoOptions | undefined } = { keys: [], opts: undefined };
  const jev: Jev = {
    async yesNo(_state, qs, opts) {
      seen.keys = qs.map((q) => q.key);
      seen.opts = opts;

      return new Map(seen.keys.map((k) => [k, k === yes ? 0.9 : 0.1]));
    },
  };

  return { jev, seen };
}

const unasked: Jev = {
  yesNo: async () => {
    throw new TypeError("jev asked about a forced move");
  },
};

describe("prompt", () => {
  test("the board as text rows with column numbers under it", () => {
    const text = evidence(board(["...R..."]), "Y", [3]);
    expect(text).toContain("\n. . . R . . .\n1 2 3 4 5 6 7\n");
    expect(text).toContain("It is Yellow's turn.");
    expect(text).toContain("Column 4 (centre)");
  });

  test("one question per candidate, keyed by column number", () => {
    const qs = questions([0, 3], "Y");
    expect(qs.map((q) => q.key)).toEqual(["1", "4"]);
    expect(qs[1]?.instructions).toStartWith("Should Yellow drop in column 4?");
  });

  test("the longest evidence fits jev's state", () => {
    expect(evidence(emptyBoard(), "Y", legalColumns(emptyBoard())).length).toBeLessThanOrEqual(
      MAX_STATE,
    );
  });
});

describe("pick", () => {
  test("answers close to the top are all possible, far ones never", () => {
    const answers = new Map([
      ["1", 0.9],
      ["2", 0.8],
      ["3", 0.5],
    ]);
    expect(pick(answers, () => 0)).toEqual({ col: 0, share: 0.9 / 2.2 });
    expect(pick(answers, () => 0.99).col).toBe(1);
  });

  test("a guess is a random candidate, marked", () => {
    expect(guess([2, 5], () => 0.6)).toEqual({ col: 5, share: null });
  });
});

describe("askJevos", () => {
  test("a forced win is played without asking", async () => {
    expect(await askJevos(unasked, game(board(["YYY.RR."]), "normal"), () => 0)).toEqual({
      col: 3,
      share: 1,
    });
  });

  test("easy asks about every column, with room for the facts", async () => {
    const { jev, seen } = recorder("4");
    expect((await askJevos(jev, game(emptyBoard(), "easy"), () => 0)).col).toBe(3);
    expect(seen.keys).toEqual(["1", "2", "3", "4", "5", "6", "7"]);
    expect(seen.opts).toEqual({ maxState: MAX_STATE });
  });

  test("hard asks only about the safe columns", async () => {
    const { jev, seen } = recorder("1");
    await askJevos(jev, game(board([".RR...."]), "hard"), () => 0);
    expect(seen.keys).toEqual(["1", "4", "5"]);
  });

  test("guesses a candidate when jev fails, rethrows other errors", async () => {
    const failing: Jev = {
      yesNo: async () => {
        throw new JevError("paused");
      },
    };
    const p = await askJevos(failing, game(board([".RR...."]), "hard"), () => 0);
    expect(p.share).toBeNull();
    expect([0, 3, 4]).toContain(p.col);

    const buggy: Jev = {
      yesNo: async () => {
        throw new TypeError("bug");
      },
    };
    const err: unknown = await askJevos(buggy, game(emptyBoard(), "easy"), () => 0).catch(
      (e: unknown) => e,
    );
    expect(err).toBeInstanceOf(TypeError);
  });

  test("jevosTurn drops jevos's disc and stamps the time", async () => {
    const { moved, last } = await jevosTurn(unasked, game(board(["YYY.RR."]), "hard"), () => 0, 5);
    expect(last.col).toBe(3);
    expect(moved.outcome).toEqual({ kind: "win", winner: "jevos", line: [35, 36, 37, 38] });
    expect(moved.game.updatedAt).toBe(5);
  });
});
