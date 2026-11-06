import { pickAny, pickFeatured } from "./pick.ts";
import { countAfter, rollTier } from "./tier.ts";
import type { Draw, Pick, Pity, Roll, Tier } from "./types.ts";

type Picker = (d: Draw, pity: Pity, random: () => number) => { pick: Pick; pity: Pity };

const any =
  (tier: Tier): Picker =>
  (d, pity, random) => ({ pick: pickAny(d.pools[tier], random), pity });

/** Limited ★5 and ★4 go through the 50/50; the rest pick from the whole tier. */
const LIMITED: Record<Tier, Picker> = {
  5: (d, pity, random) => {
    const featured = d.featured ? [d.featured.five] : [];
    const pick = pickFeatured(
      { pool: d.pools[5], featured, guarantee: pity.guaranteeFive },
      random,
    );

    return { pick, pity: { ...pity, guaranteeFive: pick.guarantee } };
  },
  4: (d, pity, random) => {
    const featured = d.featured?.fours ?? [];
    const pick = pickFeatured(
      { pool: d.pools[4], featured, guarantee: pity.guaranteeFour },
      random,
    );

    return { pick, pity: { ...pity, guaranteeFour: pick.guarantee } };
  },
  3: any(3),
};

const STANDARD: Record<Tier, Picker> = { 5: any(5), 4: any(4), 3: any(3) };

/** One pull: the tier from the counters, then the driver; returns the roll and the new counters. */
export function pullOnce(d: Draw, pity: Pity, random: () => number): { roll: Roll; pity: Pity } {
  const tier = rollTier(pity, random());
  const pickers = d.kind === "limited" && d.featured ? LIMITED : STANDARD;
  const picked = pickers[tier](d, countAfter(pity, tier), random);
  const { driverId, featured, lost } = picked.pick;

  return { roll: { driverId, tier, featured, lost }, pity: picked.pity };
}

/** `count` pulls in a row, each starting from the counters the previous one left. */
export function pullMany(
  d: Draw,
  start: Pity,
  count: number,
  random: () => number,
): { rolls: Roll[]; pity: Pity } {
  const rolls: Roll[] = [];
  let pity = start;

  for (let n = 0; n < count; n++) {
    const next = pullOnce(d, pity, random);
    rolls.push(next.roll);
    pity = next.pity;
  }

  return { rolls, pity };
}
