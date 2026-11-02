import type { Facts } from "../../src/core/countries/types.ts";

type Patch = (f: Facts) => void;

const without = <T>(list: T[], item: T): T[] => list.filter((x) => x !== item);
const add = <T>(list: T[], item: T): T[] => (list.includes(item) ? list : [...list, item]);
const landlocked: Patch = (f) => void (f.landlocked = true);

/**
 * Wikidata gaps and errors found when auditing the build, keyed by ISO2; applied after parsing.
 * Landlocked: AD AM AZ LI PY RW are not tagged. NL: EU and NATO statements carry an end time.
 * FR: co-prince of Andorra is not a monarchy. AO: left OPEC in 2024. Languages: Wikidata lacks
 * Spanish for UY, and wrongly lists Spanish for the US and AG, French for MR MU ML BF NE (no longer
 * official in the last three), English and Arabic for ER, Arabic for AF. GB is in the Commonwealth,
 * CY and MT are islands, GE spans Asia and Europe, Argentina drives on the right, Gibraltar speaks English.
 */
export const PATCHES: Record<string, Patch> = {
  NL: (f) => void (f.memberships = add(add(f.memberships, "eu"), "nato")),
  FR: (f) => void (f.monarchy = false),
  AO: (f) => void (f.memberships = without(f.memberships, "opec")),
  US: (f) => void (f.languages = without(f.languages, "es")),
  AG: (f) => void (f.languages = without(f.languages, "es")),
  UY: (f) => void (f.languages = add(f.languages, "es")),
  MR: (f) => void (f.languages = without(f.languages, "fr")),
  MU: (f) => void (f.languages = without(f.languages, "fr")),
  ML: (f) => void (f.languages = without(f.languages, "fr")),
  BF: (f) => void (f.languages = without(f.languages, "fr")),
  NE: (f) => void (f.languages = without(f.languages, "fr")),
  ER: (f) => void (f.languages = without(without(f.languages, "en"), "ar")),
  GB: (f) => void (f.memberships = add(f.memberships, "commonwealth")),
  CY: (f) => void (f.island = true),
  MT: (f) => void (f.island = true),
  GE: (f) => void (f.continents = ["asia", "europe"]),
  AR: (f) => void (f.drivesLeft = false),
  GI: (f) => void (f.languages = add(f.languages, "en")),
  AF: (f) => void (f.languages = without(f.languages, "ar")),
  AD: landlocked,
  AM: landlocked,
  AZ: landlocked,
  LI: landlocked,
  PY: landlocked,
  RW: landlocked,
};

/** Non-sovereign snapshot entries (every non-UN-member except Kosovo and Palestine): no monarchy or island answer. */
export const TERRITORIES = "AS AW BM VG KY CW FO PF GI GL GU HK IM MO MF NC MP PR SX TC VI".split(
  " ",
);

export function applyPatches(facts: Map<string, Facts>): void {
  for (const [iso2, patch] of Object.entries(PATCHES)) {
    const f = facts.get(iso2);

    if (f) patch(f);
  }

  for (const iso2 of TERRITORIES) {
    const f = facts.get(iso2);

    if (f) Object.assign(f, { monarchy: null, island: null });
  }
}
