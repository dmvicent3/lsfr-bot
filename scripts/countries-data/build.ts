import { emptyFacts } from "../../src/core/countries/facts.ts";
import type { Country, Facts, Reading, Snapshot } from "../../src/core/countries/types.ts";
import { STATS } from "../../src/modules/duel/data/stats.ts";
import type { StatId } from "../../src/modules/duel/types.ts";
import { mergeAliases } from "./aliases.ts";
import { NAME_OVERRIDES } from "./names.ts";

const MIN_STATS = 8;
// World Bank groups "Channel Islands" (JG) as a country; it has no ISO 3166 code, so no flag.
export const EXCLUDED_CODES = ["JG"];

function valuesOf(iso2: string, readings: Record<StatId, Map<string, Reading>>): Country["values"] {
  const values: Country["values"] = {};

  for (const { id } of STATS) {
    const r = readings[id].get(iso2);

    if (r && r.value > 0) values[id] = r;
  }

  return values;
}

/**
 * Joins the country list with every stat's readings and the per-country facts; drops thin
 * countries, sorts by name. Aliases are merged with the checked-in ones here, once the final
 * list of countries is known.
 */
export function build(
  countries: { iso2: string; name: string }[],
  readings: Record<StatId, Map<string, Reading>>,
  builtAt: string,
  facts: Map<string, Facts> = new Map(),
): Snapshot {
  const kept = countries
    .filter((c) => !EXCLUDED_CODES.includes(c.iso2))
    .map((c) => ({
      ...c,
      name: NAME_OVERRIDES[c.iso2] ?? c.name,
      values: valuesOf(c.iso2, readings),
    }))
    .filter((c) => Object.keys(c.values).length >= MIN_STATS);
  const aliases = mergeAliases(kept, new Map([...facts].map(([iso2, f]) => [iso2, f.aliases])));
  const full = kept.map((c) => ({
    ...c,
    facts: { ...(facts.get(c.iso2) ?? emptyFacts()), aliases: aliases.get(c.iso2) ?? [] },
  }));

  return { builtAt, countries: full.toSorted((a, b) => a.name.localeCompare(b.name)) };
}
