import type { Country, Language, Membership } from "../../../core/countries/types.ts";

const member = (m: Membership[]) => (c: Country) => m.some((x) => c.facts.memberships.includes(x));

const MEMBERSHIPS = [
  ["eu", "EU member", "isn't an EU member", ["eu"]],
  ["nato", "NATO member", "isn't a NATO member", ["nato"]],
  ["commonwealth", "Commonwealth", "isn't in the Commonwealth", ["commonwealth"]],
  ["brics_opec", "BRICS or OPEC", "isn't in BRICS or OPEC", ["brics", "opec"]],
] as const;

const LANGUAGES = [
  ["en", "English"],
  ["fr", "French"],
  ["es", "Spanish"],
  ["ar", "Arabic"],
] as const satisfies readonly (readonly [Language, string])[];

const memberships = MEMBERSHIPS.map(([id, label, why, m]) => ({
  id,
  kind: "politics" as const,
  label,
  why,
  test: member([...m]),
}));

const languages = LANGUAGES.map(([k, name]) => ({
  id: `lang_${k}` as const,
  kind: "politics" as const,
  label: `${name} official`,
  why: `${name} isn't official`,
  test: (c: Country) => c.facts.languages.includes(k),
}));

const flags = [
  {
    id: "monarchy" as const,
    kind: "politics" as const,
    label: "Monarchy",
    why: "isn't a monarchy",
    test: (c: Country) => c.facts.monarchy === true,
  },
  {
    id: "drives_left" as const,
    kind: "politics" as const,
    label: "Drives on the left",
    why: "doesn't drive on the left",
    test: (c: Country) => c.facts.drivesLeft === true,
  },
];

export const POLITICS = [...memberships, ...languages, ...flags];
