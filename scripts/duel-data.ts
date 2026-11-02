/**
 * Builds src/modules/duel/data/countries.json from the World Bank and Wikidata.
 * Usage: bun scripts/duel-data.ts, then `bun run fmt`.
 */
import { writeFileSync } from "node:fs";
import { STATS } from "../src/modules/duel/data/stats.ts";
import type { Reading, StatDef, StatId } from "../src/modules/duel/types.ts";
import { build } from "./duel-data/build.ts";
import { fetchWbCountries, fetchWbIndicator, fetchWikidata } from "./duel-data/fetch.ts";
import { parseWbCountries, parseWbIndicator } from "./duel-data/parse-wb.ts";
import { parseWikidataPeaks } from "./duel-data/parse-wikidata.ts";

const OUT = new URL("../src/modules/duel/data/countries.json", import.meta.url);

async function read(stat: StatDef, today: Date): Promise<Map<string, Reading>> {
  const year = today.getUTCFullYear();

  if ("wb" in stat.source) {
    return parseWbIndicator(await fetchWbIndicator(fetch, stat.source.wb, year - 1));
  }

  return parseWikidataPeaks(await fetchWikidata(fetch), year);
}

function summary(readings: Record<StatId, Map<string, Reading>>, kept: Set<string>): string[] {
  return STATS.map(({ id }) => {
    const used = [...readings[id]].filter(([iso2]) => kept.has(iso2));
    const oldest = Math.min(...used.map(([, r]) => r.year));

    return `${id.padEnd(10)} ${String(used.length).padStart(3)} countries, oldest year ${oldest}`;
  });
}

async function main(): Promise<void> {
  const today = new Date();
  const countries = parseWbCountries(await fetchWbCountries(fetch));
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the loop below fills every stat
  const readings = {} as Record<StatId, Map<string, Reading>>;

  for (const stat of STATS) readings[stat.id] = await read(stat, today);

  const snapshot = build(countries, readings, today.toISOString().slice(0, 10));

  writeFileSync(OUT, JSON.stringify(snapshot));
  console.log(`${snapshot.countries.length} countries kept of ${countries.length}`);
  console.log(summary(readings, new Set(snapshot.countries.map((c) => c.iso2))).join("\n"));
}

await main();
