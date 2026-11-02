import type { Country, Snapshot, StatId } from "../../../src/modules/duel/types.ts";

const IDS: StatId[] = [
  "population",
  "area",
  "density",
  "gdp_pc",
  "life_exp",
  "urban",
  "forest",
  "arable",
  "co2_pc",
  "internet",
  "fertility",
  "tourists",
  "aged_65",
  "peak",
];

const NAMES: [string, string][] = [
  ["NL", "Netherlands"],
  ["PT", "Portugal"],
  ["BR", "Brazil"],
  ["JP", "Japan"],
  ["EG", "Egypt"],
  ["NO", "Norway"],
  ["IN", "India"],
  ["KE", "Kenya"],
  ["AU", "Australia"],
  ["CL", "Chile"],
  ["MC", "Monaco"],
  ["NE", "Niger"],
];

/** Deterministic value per country and stat; every third stat of the last two is missing. */
function country(name: [string, string], index: number): Country {
  const values: Country["values"] = {};

  IDS.forEach((id, s) => {
    if (index >= 10 && s % 3 === 0) return;

    values[id] = { value: (index + 1) * (s + 1) * 1.5, year: 2020 + ((index + s) % 4) };
  });

  return { iso2: name[0], name: name[1], values };
}

/** Twelve countries covering every stat, with deliberate gaps on MC and NE. */
export function fixtureSnapshot(): Snapshot {
  return { builtAt: "2026-11-02", countries: NAMES.map(country) };
}
