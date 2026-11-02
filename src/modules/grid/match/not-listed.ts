import { normaliseName } from "../../../core/countries/normalise.ts";

const LISTS: Record<string, string[]> = {
  "Vatican City": ["Vatican", "Vatican City", "Holy See"],
  Taiwan: ["Taiwan", "Republic of China"],
};

/** Real places this game's country list leaves out, by normalised name or alias. */
export const NOT_LISTED = new Map(
  Object.entries(LISTS).flatMap(([shown, names]) => names.map((n) => [normaliseName(n), shown])),
);

/** The display name when the typed text names a country the game doesn't list. */
export const notListed = (text: string): string | undefined =>
  NOT_LISTED.get(normaliseName(text.trim()));
