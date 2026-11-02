import { describe, expect, test } from "bun:test";
import { award } from "../../../src/modules/duel/scoring.ts";

describe("award", () => {
  test("zero correct, first day", () => {
    expect(award(0, 1)).toEqual({ points: 0, parts: ["0 correct: 0"] });
  });

  test("four correct with a streak", () => {
    expect(award(4, 3)).toEqual({
      points: 90,
      parts: ["4 correct: 80", "Streak 3: +10"],
    });
  });

  test("perfect adds the bonus", () => {
    expect(award(5, 1)).toEqual({
      points: 120,
      parts: ["5 correct: 100", "Perfect: +20"],
    });
  });

  test("streak bonus is capped", () => {
    expect(award(5, 20)).toEqual({
      points: 170,
      parts: ["5 correct: 100", "Perfect: +20", "Streak 20: +50"],
    });
  });
});
