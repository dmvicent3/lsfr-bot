import { asText, isRecord, records } from "../../src/core/guards.ts";
import type { Reading } from "../../src/modules/duel/types.ts";

const MIN_YEAR = 2015;

/** The rows of a World Bank response: element 1 of the [meta, rows] pair. */
function rows(json: unknown): Record<string, unknown>[] {
  return Array.isArray(json) ? records(json[1]) : [];
}

export function parseWbCountries(json: unknown): { iso2: string; name: string }[] {
  return rows(json)
    .filter((r) => isRecord(r.region) && r.region.id !== "NA")
    .map((r) => ({ iso2: asText(r.iso2Code), name: asText(r.name) }))
    .filter((c) => c.iso2 !== "" && c.name !== "");
}

function toReading(row: Record<string, unknown>, maxYear: number): Reading | null {
  const year = Number(asText(row.date));

  if (typeof row.value !== "number" || !Number.isInteger(year)) return null;

  if (year < MIN_YEAR || year > maxYear) return null;

  return { value: row.value, year };
}

/** Latest non-null reading per ISO2 code, from 2015 to `maxYear` (default: no cap). */
export function parseWbIndicator(json: unknown, maxYear = Infinity): Map<string, Reading> {
  const out = new Map<string, Reading>();

  for (const row of rows(json)) {
    const iso2 = isRecord(row.country) ? asText(row.country.id) : "";
    const r = toReading(row, maxYear);

    if (iso2 !== "" && r && r.year > (out.get(iso2)?.year ?? 0)) out.set(iso2, r);
  }

  return out;
}
