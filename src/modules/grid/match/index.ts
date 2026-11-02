import type { Country, Snapshot } from "../../../core/countries/types.ts";
import { normaliseName } from "../../../core/countries/normalise.ts";

export interface Entry {
  key: string;
  iso2: string;
}

export interface Index {
  exact: Map<string, string>;
  /** Fuzzy candidates: display names and pre-"and" short names only, never aliases. */
  entries: Entry[];
  byIso: Map<string, Country>;
}

const memo = new WeakMap<Snapshot, Index>();

const short = (s: string) => normaliseName(s).split(" and ")[0] ?? "";

/** Normalised name, alias (exact only) and pre-"and" short-name keys per country, built once per snapshot. */
export function indexOf(snapshot: Snapshot): Index {
  const hit = memo.get(snapshot);

  if (hit) return hit;

  const index: Index = { exact: new Map(), entries: [], byIso: new Map() };

  for (const country of snapshot.countries) {
    index.byIso.set(country.iso2, country);

    const names = [normaliseName(country.name), short(country.name)];
    const aliases = country.facts.aliases.flatMap((a) => [normaliseName(a), short(a)]);

    for (const key of [...names, ...aliases]) {
      if (key === "" || index.exact.has(key)) continue;

      index.exact.set(key, country.iso2);

      if (names.includes(key)) index.entries.push({ key, iso2: country.iso2 });
    }
  }

  memo.set(snapshot, index);

  return index;
}
