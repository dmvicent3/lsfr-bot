import { describe, expect, test } from "bun:test";
import { countAfter, rollTier } from "../../../../src/modules/gacha/engine/tier.ts";
import type { Pity } from "../../../../src/modules/gacha/engine/types.ts";

const pity = (five: number, four: number): Pity => ({
  five,
  four,
  guaranteeFive: false,
  guaranteeFour: false,
});

describe("rollTier", () => {
  test("base rates: ★5 under 0.006, ★4 under 0.057, else ★3", () => {
    expect(rollTier(pity(0, 0), 0.0059)).toBe(5);
    expect(rollTier(pity(0, 0), 0.006)).toBe(4);
    expect(rollTier(pity(0, 0), 0.0569)).toBe(4);
    expect(rollTier(pity(0, 0), 0.057)).toBe(3);
  });

  test("pull 90 is always ★5", () => {
    expect(rollTier(pity(89, 0), 0.9999)).toBe(5);
  });

  test("pull 10 since a ★4 is always ★4 or better, and can be ★5", () => {
    expect(rollTier(pity(0, 9), 0.9999)).toBe(4);
    expect(rollTier(pity(0, 9), 0.001)).toBe(5);
  });

  test("pull 9 since a ★4 has a 56.1 % ★4 chance on top of ★5", () => {
    expect(rollTier(pity(0, 8), 0.566)).toBe(4);
    expect(rollTier(pity(0, 8), 0.568)).toBe(3);
  });
});

describe("countAfter", () => {
  test("a ★5 resets the ★5 counter and the ★4 counter keeps counting", () => {
    expect(countAfter(pity(40, 9), 5)).toMatchObject({ five: 0, four: 10 });
  });

  test("a ★4 resets only the ★4 counter", () => {
    expect(countAfter(pity(40, 9), 4)).toMatchObject({ five: 41, four: 0 });
  });

  test("a ★3 counts on both", () => {
    expect(countAfter(pity(40, 3), 3)).toMatchObject({ five: 41, four: 4 });
  });
});
