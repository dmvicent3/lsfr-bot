import { normaliseName } from "../../../core/countries/normalise.ts";
import type { Country, Snapshot } from "../../../core/countries/types.ts";
import { levenshtein } from "../../../core/levenshtein.ts";
import { indexOf, type Entry } from "./index.ts";

function allowedDistance(length: number): number {
  if (length >= 9) return 2;

  return length >= 5 ? 1 : 0;
}

/** True when the text is a strict prefix or suffix of another country's key (Dominican, Guine). */
function clipsOther(text: string, entries: Entry[], iso2: string): boolean {
  return entries.some(
    (e) =>
      e.iso2 !== iso2 &&
      e.key.length > text.length &&
      (e.key.startsWith(text) || e.key.endsWith(text)),
  );
}

function fuzzy(text: string, entries: Entry[]): string | null {
  const max = allowedDistance(text.length);

  if (max === 0) return null;

  const near = new Set(entries.filter((e) => levenshtein(text, e.key) <= max).map((e) => e.iso2));

  if (near.size !== 1) return null;

  const [iso2] = near;

  return iso2 !== undefined && !clipsOther(text, entries, iso2) ? iso2 : null;
}

/** The country a guess names: exact name or alias first, else one unambiguous near miss. */
export function matchCountry(text: string, snapshot: Snapshot): Country | null {
  const key = normaliseName(text.trim());

  if (key === "") return null;

  const index = indexOf(snapshot);
  const iso2 = index.exact.get(key) ?? fuzzy(key, index.entries);

  return iso2 === undefined || iso2 === null ? null : (index.byIso.get(iso2) ?? null);
}
