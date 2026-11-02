import type { Snapshot } from "../../../core/countries/types.ts";

const cache = new WeakMap<Snapshot, Map<string, string>>();

/** iso2 to country name, built once per snapshot. */
export function countryNames(snap: Snapshot): Map<string, string> {
  let names = cache.get(snap);

  if (!names) {
    names = new Map(snap.countries.map((c) => [c.iso2, c.name]));
    cache.set(snap, names);
  }

  return names;
}
