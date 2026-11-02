import { FLAG_COLOURS } from "../../src/core/countries/facts.ts";
import type { FlagColour, FlagFeature } from "../../src/core/countries/types.ts";
import { FEATURES } from "./flag-features.ts";

/**
 * Colours replace the detected ones where the SVG's colours are wrong: emblems and coats of arms
 * add colours that are not prominent (ES MX EC PT BO SV NI HR RS SM AD MD MT CY BZ DM GT HT PG ...),
 * and near-blacks or maroons read as another family. Entries are "ISO2 colour colour ...".
 */
const COLOUR_TABLE = `AF black red green; AS red blue white; AD blue yellow red; AO red black yellow; AG red black blue white yellow;
AM red blue orange; BS blue yellow black; BE black yellow red; BZ blue red white; BM red blue white;
BT yellow orange white; BW blue black white; VG blue red white; BN yellow white black red;
CV blue white red yellow; KH red blue white; KY blue red white; HR red white blue; DO blue red white;
EC yellow blue red; EG red white black; SV blue white; GQ green white red blue; EE blue black white;
FJ blue red white; PF red white blue yellow; GH red yellow green black; GI red white; GU blue red;
GT blue white; HT blue red white; IQ red white black green; IM red white; JM green yellow black;
JO black white green red; KI red blue white yellow; KW green white red black; LS blue white green black;
LI blue red yellow; MW black red green; MT red white; MX green white red; MD blue yellow red;
ME red yellow; MZ red green yellow white black; NI blue white; MP blue white; PS black white green red;
PG red black yellow white; PY red white blue; PT green red yellow; QA red white; SM white blue;
ST green yellow red black; RS red blue white; SX red blue white; SK white blue red; SI white blue red;
SS black red green white blue yellow; LK red yellow orange green; LC blue yellow white black;
SD red white black green; SY green white black red; TL red yellow black white; TT red white black;
TM green red white; TC blue red white; AE green white black red; VI white blue yellow;
YE red white black;
ES red yellow; BO red yellow green`;

const COLOURS: Record<string, FlagColour[]> = Object.fromEntries(
  COLOUR_TABLE.split(";")
    .map((entry) => entry.trim().split(/\s+/))
    .map(([iso2 = "", ...names]) => [iso2, FLAG_COLOURS.filter((c) => names.includes(c))]),
);

export interface FlagOverride {
  colours?: FlagColour[];
  features: FlagFeature[];
}

export const FLAG_OVERRIDES: Record<string, FlagOverride> = Object.fromEntries(
  Object.entries(FEATURES).map(([iso2, features]) => {
    const colours = COLOURS[iso2];

    return [iso2, colours ? { colours, features } : { features }];
  }),
);

/** The final colours and features: override colours replace detected ones, features always come from the table. */
export function applyOverrides(
  iso2: string,
  detected: FlagColour[],
): { colours: FlagColour[]; features: FlagFeature[] } {
  const override = FLAG_OVERRIDES[iso2];

  return { colours: override?.colours ?? detected, features: override?.features ?? [] };
}
