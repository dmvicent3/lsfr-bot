import { asText, isRecord, records } from "../../src/core/guards.ts";
import type { Reading } from "../../src/modules/duel/types.ts";

function cell(row: Record<string, unknown>, key: string): string {
  const c = row[key];

  return isRecord(c) ? asText(c.value) : "";
}

/** Highest elevation per ISO2 code; `year` is the build year. */
export function parseWikidataPeaks(json: unknown, year: number): Map<string, Reading> {
  const results = isRecord(json) && isRecord(json.results) ? json.results : {};
  const out = new Map<string, Reading>();

  for (const row of records(results.bindings)) {
    const iso2 = cell(row, "iso");
    const value = Number(cell(row, "elev"));

    if (iso2 !== "" && Number.isFinite(value) && value > (out.get(iso2)?.value ?? 0)) {
      out.set(iso2, { value, year });
    }
  }

  return out;
}
