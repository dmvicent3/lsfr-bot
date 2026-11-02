import type { Country, FlagColour, FlagFeature } from "../../../core/countries/types.ts";

const COLOURS: FlagColour[] = ["red", "blue", "green", "yellow", "white", "black", "orange"];

const FEATURES = [
  ["star", "Flag has a star", "flag has no star"],
  ["crescent", "Flag has a crescent", "flag has no crescent"],
  ["emblem", "Flag has an emblem", "flag has no emblem"],
] as const satisfies readonly (readonly [FlagFeature, string, string])[];

const colours = COLOURS.map((k) => ({
  id: `flag_${k}` as const,
  kind: "flag" as const,
  label: `Flag has ${k}`,
  why: `flag has no ${k}`,
  test: (c: Country) => c.facts.flagColours.includes(k),
}));

const features = FEATURES.map(([k, label, why]) => ({
  id: `flag_${k}` as const,
  kind: "flag" as const,
  label,
  why,
  test: (c: Country) => c.facts.flagFeatures.includes(k),
}));

export const FLAG = [...colours, ...features];
