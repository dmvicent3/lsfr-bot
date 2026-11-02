import { STATS } from "../../src/modules/duel/data/stats.ts";
import type { Country, Reading, Snapshot, StatId } from "../../src/modules/duel/types.ts";
import { NAME_OVERRIDES } from "./names.ts";

const MIN_STATS = 8;

function valuesOf(iso2: string, readings: Record<StatId, Map<string, Reading>>): Country["values"] {
  const values: Country["values"] = {};

  for (const { id } of STATS) {
    const r = readings[id].get(iso2);

    if (r && r.value > 0) values[id] = r;
  }

  return values;
}

/** Joins the country list with every stat's readings; drops thin countries, sorts by name. */
export function build(
  countries: { iso2: string; name: string }[],
  readings: Record<StatId, Map<string, Reading>>,
  builtAt: string,
): Snapshot {
  const full = countries
    .map((c) => ({
      ...c,
      name: NAME_OVERRIDES[c.iso2] ?? c.name,
      values: valuesOf(c.iso2, readings),
    }))
    .filter((c) => Object.keys(c.values).length >= MIN_STATS);

  return { builtAt, countries: full.toSorted((a, b) => a.name.localeCompare(b.name)) };
}
