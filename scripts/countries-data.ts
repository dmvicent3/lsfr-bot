/**
 * Builds src/core/countries/countries.json from the World Bank and Wikidata.
 * Usage: bun scripts/countries-data.ts, then `bun run fmt`.
 */
import { writeFileSync } from "node:fs";
import { STATS } from "../src/modules/duel/data/stats.ts";
import type { Reading, StatDef, StatId } from "../src/modules/duel/types.ts";
import { factCounts, flagTable } from "./countries-data/audit.ts";
import { build } from "./countries-data/build.ts";
import { gatherFacts } from "./countries-data/gather-facts.ts";
import { fetchWbCountries, fetchWbIndicator, fetchWikidata } from "./countries-data/fetch.ts";
import { parseWbCountries, parseWbIndicator } from "./countries-data/parse-wb.ts";
import { parseWikidataPeaks } from "./countries-data/parse-wikidata.ts";

const OUT = new URL("../src/core/countries/countries.json", import.meta.url);

async function read(stat: StatDef, today: Date): Promise<Map<string, Reading>> {
  const year = today.getUTCFullYear();

  if ("wb" in stat.source) {
    return parseWbIndicator(await fetchWbIndicator(fetch, stat.source.wb, year - 1), stat.maxYear);
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

  const builtAt = today.toISOString().slice(0, 10);
  const stats = build(countries, readings, builtAt);
  const facts = await gatherFacts(fetch, new Set(stats.countries.map((c) => c.iso2)));
  const snapshot = build(countries, readings, builtAt, facts);

  writeFileSync(OUT, JSON.stringify(snapshot));
  console.log(`${snapshot.countries.length} countries kept of ${countries.length}`);
  console.log(flagTable(snapshot).join("\n"));
  console.log(factCounts(snapshot).join("\n"));
  console.log(summary(readings, new Set(snapshot.countries.map((c) => c.iso2))).join("\n"));
}

await main();
