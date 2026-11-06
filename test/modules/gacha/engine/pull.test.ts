import { describe, expect, test } from "bun:test";
import { lcg } from "../../../../src/core/random.ts";
import { pullMany, pullOnce } from "../../../../src/modules/gacha/engine/pull.ts";
import type { Draw, Pity } from "../../../../src/modules/gacha/engine/types.ts";
import { seq } from "../testing/seq.ts";

const POOLS = {
  5: ["f1", "f2", "f3"],
  4: ["q1", "q2", "q3", "q4", "q5"],
  3: ["t1", "t2"],
};
const LIMITED: Draw = {
  kind: "limited",
  featured: { five: "f1", fours: ["q1", "q2", "q3"] },
  pools: POOLS,
};
const STANDARD: Draw = { kind: "standard", featured: null, pools: POOLS };
const FRESH: Pity = { five: 0, four: 0, guaranteeFive: false, guaranteeFour: false };

describe("pullOnce on a limited banner", () => {
  test("a won 50/50 gives the featured ★5 and no guarantee", () => {
    const { roll, pity } = pullOnce(LIMITED, FRESH, seq(0, 0.2, 0));

    expect(roll).toEqual({ driverId: "f1", tier: 5, featured: true, lost: false });
    expect(pity).toMatchObject({ five: 0, four: 1, guaranteeFive: false });
  });

  test("a lost 50/50 gives another ★5 and sets the guarantee", () => {
    const { roll, pity } = pullOnce(LIMITED, FRESH, seq(0, 0.7, 0.9));

    expect(roll).toEqual({ driverId: "f3", tier: 5, featured: false, lost: true });
    expect(pity.guaranteeFive).toBe(true);
  });

  test("the guarantee gives the featured ★5 and clears", () => {
    const { roll, pity } = pullOnce(LIMITED, { ...FRESH, guaranteeFive: true }, seq(0, 0.99));

    expect(roll.driverId).toBe("f1");
    expect(pity.guaranteeFive).toBe(false);
  });

  test("a lost ★4 50/50 gives a non-featured ★4 and sets the ★4 guarantee", () => {
    const { roll, pity } = pullOnce(LIMITED, FRESH, seq(0.03, 0.9, 0.99));

    expect(roll).toEqual({ driverId: "q5", tier: 4, featured: false, lost: true });
    expect(pity).toMatchObject({ four: 0, five: 1, guaranteeFour: true });
  });

  test("the ★4 guarantee picks one of the three featured", () => {
    const { roll } = pullOnce(LIMITED, { ...FRESH, guaranteeFour: true }, seq(0.03, 0.5));

    expect(roll).toMatchObject({ driverId: "q2", featured: true });
  });

  test("a ★3 leaves both guarantees as they were", () => {
    const start = { ...FRESH, guaranteeFive: true, guaranteeFour: true };
    const { roll, pity } = pullOnce(LIMITED, start, seq(0.5, 0));

    expect(roll.tier).toBe(3);
    expect(pity).toMatchObject({ guaranteeFive: true, guaranteeFour: true });
  });
});

describe("pullOnce on the standard banner", () => {
  test("no 50/50: any ★5, guarantees untouched", () => {
    const { roll, pity } = pullOnce(STANDARD, FRESH, seq(0, 0.99));

    expect(roll).toEqual({ driverId: "f3", tier: 5, featured: false, lost: false });
    expect(pity.guaranteeFive).toBe(false);
  });
});

describe("pullMany", () => {
  test("ten pulls from a fresh start always hold a ★4 or better", () => {
    for (let seed = 1; seed <= 200; seed++) {
      const { rolls } = pullMany(STANDARD, FRESH, 10, lcg(seed));

      expect(rolls.some((r) => r.tier >= 4)).toBe(true);
    }
  });

  test("90 pulls from a fresh start always hold a ★5", () => {
    for (let seed = 1; seed <= 50; seed++) {
      const { rolls } = pullMany(LIMITED, FRESH, 90, lcg(seed));

      expect(rolls.some((r) => r.tier === 5)).toBe(true);
    }
  });

  test("counters carry from pull to pull", () => {
    const { pity } = pullMany(STANDARD, FRESH, 3, seq(0.5));

    expect(pity).toMatchObject({ five: 3, four: 3 });
  });
});
