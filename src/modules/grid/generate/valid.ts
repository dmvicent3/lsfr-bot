import type { Snapshot } from "../../../core/countries/types.ts";
import { RULES } from "../rules/catalogue.ts";
import { RULE_ID_LIST, type RuleId } from "../types.ts";

type Matches = Map<RuleId, Set<string>>;

const cache = new WeakMap<Snapshot, Matches>();

/** Each rule's matching iso2 set, computed once per snapshot. */
export function matchesOf(snapshot: Snapshot): Matches {
  const hit = cache.get(snapshot);

  if (hit) return hit;

  const out: Matches = new Map();

  for (const id of RULE_ID_LIST) {
    out.set(id, new Set(snapshot.countries.filter((c) => RULES[id].test(c)).map((c) => c.iso2)));
  }

  cache.set(snapshot, out);

  return out;
}

/** The countries satisfying both rules, iso2 sorted. */
export function validFor(snapshot: Snapshot, row: RuleId, col: RuleId): string[] {
  const matches = matchesOf(snapshot);
  const cols = matches.get(col) ?? new Set<string>();

  return [...(matches.get(row) ?? [])].filter((iso) => cols.has(iso)).toSorted();
}
