import { describe, expect, test } from "bun:test";
import { fiveChance, fourChance } from "../../../../src/modules/gacha/engine/rates.ts";

describe("fiveChance", () => {
  test("0.6 % up to pull 73", () => {
    expect(fiveChance(1)).toBeCloseTo(0.006, 10);
    expect(fiveChance(73)).toBeCloseTo(0.006, 10);
  });

  test("soft pity adds 6 points a pull from 74", () => {
    expect(fiveChance(74)).toBeCloseTo(0.066, 10);
    expect(fiveChance(75)).toBeCloseTo(0.126, 10);
    expect(fiveChance(89)).toBeCloseTo(0.966, 10);
  });

  test("hard pity at 90", () => {
    expect(fiveChance(90)).toBe(1);
    expect(fiveChance(95)).toBe(1);
  });
});

describe("fourChance", () => {
  test("5.1 % up to pull 8, 56.1 % on 9, certain from 10", () => {
    expect(fourChance(1)).toBeCloseTo(0.051, 10);
    expect(fourChance(8)).toBeCloseTo(0.051, 10);
    expect(fourChance(9)).toBeCloseTo(0.561, 10);
    expect(fourChance(10)).toBe(1);
    expect(fourChance(12)).toBe(1);
  });
});
