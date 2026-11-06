import { describe, expect, test } from "bun:test";
import { balanceOf, costOf } from "../../../../src/modules/gacha/engine/balance.ts";

describe("balanceOf", () => {
  test("earned plus refunds minus spent", () => {
    expect(balanceOf({ earned: 1000, refunds: 70, spent: 840 })).toBe(230);
  });
});

describe("costOf", () => {
  test("the cost when the balance covers it, to the last unit", () => {
    expect(costOf({ earned: 1400, refunds: 0, spent: 0 }, 140, 10)).toBe(1400);
  });

  test("null when it does not", () => {
    expect(costOf({ earned: 1399, refunds: 0, spent: 0 }, 140, 10)).toBeNull();
    expect(costOf({ earned: 200, refunds: 0, spent: 100 }, 140, 1)).toBeNull();
  });
});
