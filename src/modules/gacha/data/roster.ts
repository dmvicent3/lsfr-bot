import type { Tier } from "../engine/types.ts";
import type { Driver, Roster } from "../types.ts";
import snapshot from "./drivers.json";

const toTier = (n: number): Tier => (n === 5 || n === 4 ? n : 3);

/** Drivers by id and by tier. */
export function rosterOf(drivers: readonly (Omit<Driver, "tier"> & { tier: number })[]): Roster {
  const all = drivers.map((d): Driver => ({ ...d, tier: toTier(d.tier) }));
  const ids = (t: Tier): string[] => all.filter((d) => d.tier === t).map((d) => d.id);

  return {
    drivers: all,
    byId: new Map(all.map((d) => [d.id, d])),
    pools: { 5: ids(5), 4: ids(4), 3: ids(3) },
  };
}

/** Once-per-process: the committed snapshot never changes while the bot runs. */
export const ROSTER: Roster = rosterOf(snapshot.drivers);

/** When the snapshot was built. */
export const ROSTER_BUILT = snapshot.builtAt;
