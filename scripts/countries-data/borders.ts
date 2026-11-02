import type { Facts } from "../../src/core/countries/types.ts";

const pairs = (list: string): Set<string> => new Set(list.split(/\s+/));
const key = (a: string, b: string): string => (a < b ? `${a}-${b}` : `${b}-${a}`);

/** Wikidata P47 also lists sea neighbours, bridges and disputed claims; these pairs share no land border. */
const NOT_LAND = pairs(`AU-NC BS-TC BS-US VG-VI PR-VI GU-MP CN-KR CY-IL CY-TR DK-NO DK-SE DZ-ES
DZ-IT EG-SA FR-VE IR-KW IR-OM IR-QA IR-SA AE-IR IT-MT LV-SE LT-SE NL-VE PA-US RU-SE RU-US US-VE
AF-IN AL-RS SD-UG KE-SD CD-SD CD-CM CO-NI AO-GA`);
/** Island countries that do share a land border with a neighbour on the same island. */
const SHARED_ISLAND = pairs("DO-HT GB-IE ID-MY ID-PG ID-TL SX-MF SX-FR GL-CA");
/** Land borders Wikidata does not list. */
const ADDED = ["CN-HK", "CN-MO", "SX-MF"];

function isLand(a: string, b: string, island: (iso2: string) => boolean): boolean {
  const pair = key(a, b);

  if (NOT_LAND.has(pair)) return false;

  return !(island(a) || island(b)) || SHARED_ISLAND.has(pair);
}

/** Reduces every country's borders to land borders, in place. */
export function landBorders(facts: Map<string, Facts>): void {
  const island = (iso2: string) => facts.get(iso2)?.island === true;

  for (const [iso2, f] of facts) f.borders = f.borders.filter((b) => isLand(iso2, b, island));

  for (const pair of ADDED) {
    const [a = "", b = ""] = pair.split("-");

    for (const [from, to] of [
      [a, b],
      [b, a],
    ] as const) {
      const f = facts.get(from);

      if (f && facts.has(to) && !f.borders.includes(to)) f.borders.push(to);
    }
  }
}
