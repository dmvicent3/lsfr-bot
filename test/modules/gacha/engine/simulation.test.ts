import { expect, test } from "bun:test";
import { lcg } from "../../../../src/core/random.ts";
import { pullOnce } from "../../../../src/modules/gacha/engine/pull.ts";
import type { Draw, Pity } from "../../../../src/modules/gacha/engine/types.ts";

const PULLS = 1_000_000;
const DRAW: Draw = {
  kind: "limited",
  featured: { five: "a", fours: ["d", "e", "f"] },
  pools: { 5: ["a", "b", "c"], 4: ["d", "e", "f", "g"], 3: ["h"] },
};

/** Published consolidated rates: ★5 about 1.6 %, one every ~62.5 pulls; ★4 about 13 %. */
test("over a million seeded pulls the ★5 rate is about 1.6 % and the mean gap about 62", () => {
  const random = lcg(20_261_106);
  let pity: Pity = { five: 0, four: 0, guaranteeFive: false, guaranteeFour: false };
  let fives = 0;
  let fours = 0;
  let featured = 0;
  let gap = 0;
  let maxFourGap = 0;

  for (let n = 0; n < PULLS; n++) {
    const next = pullOnce(DRAW, pity, random);
    pity = next.pity;
    gap = next.roll.tier >= 4 ? 0 : gap + 1;
    maxFourGap = Math.max(maxFourGap, gap);
    fives += next.roll.tier === 5 ? 1 : 0;
    fours += next.roll.tier === 4 ? 1 : 0;
    featured += next.roll.tier === 5 && next.roll.driverId === "a" ? 1 : 0;
  }

  console.log(
    `simulation: ★5 ${((fives / PULLS) * 100).toFixed(3)} %, mean gap ${(PULLS / fives).toFixed(2)}, ★4 ${((fours / PULLS) * 100).toFixed(2)} %`,
  );
  expect(fives / PULLS).toBeGreaterThan(0.0155);
  expect(fives / PULLS).toBeLessThan(0.0165);
  expect(PULLS / fives).toBeGreaterThan(60.5);
  expect(PULLS / fives).toBeLessThan(64.5);
  expect(fours / PULLS).toBeGreaterThan(0.12);
  expect(fours / PULLS).toBeLessThan(0.14);
  // The guarantee makes about two thirds of ★5s the featured one.
  expect(featured / fives).toBeGreaterThan(0.64);
  expect(featured / fives).toBeLessThan(0.69);
  expect(maxFourGap).toBeLessThan(10);
}, 30_000);
