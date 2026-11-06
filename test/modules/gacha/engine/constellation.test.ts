import { describe, expect, test } from "bun:test";
import {
  landCopies,
  levelOf,
  refundFor,
} from "../../../../src/modules/gacha/engine/constellation.ts";
import type { Roll } from "../../../../src/modules/gacha/engine/types.ts";

const roll = (driverId: string, tier: Roll["tier"]): Roll => ({
  driverId,
  tier,
  featured: false,
  lost: false,
});

describe("levelOf", () => {
  test("C0 on the first copy, C6 from the seventh", () => {
    expect(levelOf(1)).toBe(0);
    expect(levelOf(4)).toBe(3);
    expect(levelOf(7)).toBe(6);
    expect(levelOf(9)).toBe(6);
  });
});

describe("refundFor", () => {
  test("half the tier's average cost, as pull-price multiples", () => {
    expect(refundFor(5, 140)).toBe(5600);
    expect(refundFor(4, 140)).toBe(700);
    expect(refundFor(3, 140)).toBe(70);
    expect(refundFor(3, 85)).toBe(43);
  });
});

describe("landCopies", () => {
  test("a new driver is C0, a repeat in the same 10-pull counts on", () => {
    const { landed, copies } = landCopies(new Map(), [roll("a", 3), roll("a", 3)], 100);

    expect(landed.map((l) => [l.level, l.isNew, l.refund])).toEqual([
      [0, true, 0],
      [1, false, 0],
    ]);
    expect(copies.get("a")).toBe(2);
  });

  test("the seventh copy is C6; the eighth refunds and stays C6", () => {
    const { landed, copies } = landCopies(new Map([["v", 6]]), [roll("v", 5), roll("v", 5)], 100);

    expect(landed.map((l) => [l.level, l.refund])).toEqual([
      [6, 0],
      [6, 4000],
    ]);
    expect(copies.get("v")).toBe(7);
  });

  test("leaves the map it was given untouched", () => {
    const held = new Map([["a", 1]]);
    landCopies(held, [roll("a", 4)], 10);

    expect(held.get("a")).toBe(1);
  });
});
