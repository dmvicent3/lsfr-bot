import type { Continent, Country } from "../../../core/countries/types.ts";
import { normaliseName } from "../../../core/countries/normalise.ts";
import type { RuleDef } from "../types.ts";

const CONTINENTS = [
  ["africa", "Africa", "in Africa"],
  ["asia", "Asia", "in Asia"],
  ["europe", "Europe", "in Europe"],
  ["north_america", "North America", "in North America"],
  ["south_america", "South America", "in South America"],
  ["oceania", "Oceania", "in Oceania"],
] as const satisfies readonly (readonly [Continent, string, string])[];

const LETTERS = ["a", "b", "s", "m", "c"] as const;

/** Lowercase first letter of the normalised display name (accents, punctuation and a leading "The" ignored). */
export function nameLetter(c: Country): string {
  return normaliseName(c.name)[0] ?? "";
}

const continents = CONTINENTS.map(([id, label, where]) => ({
  id,
  kind: "geo" as const,
  group: "continent",
  label,
  why: `isn't ${where}`,
  test: (c: Country) => c.facts.continents.includes(id),
}));

const letters = LETTERS.map((l) => ({
  id: `letter_${l}` as const,
  kind: "geo" as const,
  label: `Name starts with ${l.toUpperCase()}`,
  why: `doesn't start with ${l.toUpperCase()}`,
  test: (c: Country) => nameLetter(c) === l,
}));

const other: (RuleDef & { id: "landlocked" | "island" | "borders_4" | "borders_0_1" })[] = [
  {
    id: "landlocked",
    kind: "geo",
    label: "Landlocked",
    why: "isn't landlocked",
    test: (c) => c.facts.landlocked === true,
  },
  {
    id: "island",
    kind: "geo",
    label: "Island nation",
    why: "isn't an island nation",
    test: (c) => c.facts.island === true,
  },
  {
    id: "borders_4",
    kind: "geo",
    label: "Borders 4+",
    why: "doesn't border 4+ countries",
    test: (c) => c.facts.borders.length >= 4,
  },
  {
    id: "borders_0_1",
    kind: "geo",
    label: "Borders 0–1",
    why: "has 2+ neighbours",
    test: (c) => c.facts.borders.length <= 1,
  },
];

export const GEO = [...continents, ...letters, ...other];
