import { describe, expect, test } from "bun:test";
import { guess, pick } from "../../../src/modules/tictactoe/pick.ts";
import { board } from "./fixtures.ts";

const answers = (o: Record<string, number>) => new Map(Object.entries(o));

describe("pick", () => {
  test("a clear top square stands alone, with its share of the yeses", () => {
    const p = pick(answers({ "1": 0.9, "5": 0.2 }), () => 0.99);
    expect(p.square).toBe(0);
    expect(p.share).toBeCloseTo(0.9 / 1.1);
  });

  test("squares within 0.8 of the top are picked at random", () => {
    const close = answers({ "1": 0.5, "5": 0.45, "9": 0.1 });
    expect(pick(close, () => 0).square).toBe(0);
    expect(pick(close, () => 0.99).square).toBe(4);
  });

  test("all-zero answers share evenly", () => {
    expect(pick(answers({ "1": 0, "2": 0, "3": 0 }), () => 0).share).toBeCloseTo(1 / 3);
  });
});

describe("guess", () => {
  test("an empty square, with no share", () => {
    expect(guess(board("XOXOXO-XO"), () => 0.5)).toEqual({ square: 6, share: null });
  });
});
