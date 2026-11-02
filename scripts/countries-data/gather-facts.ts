import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { coloursFromSvg } from "./flag-colours.ts";
import { applyOverrides } from "./flag-overrides.ts";
import { FACT_QUERIES } from "./facts-queries.ts";
import { fetchFacts, fetchFlagSvg } from "./fetch.ts";
import { applyPatches } from "./patches.ts";
import { flagUrls, parseFacts } from "./parse-facts.ts";
import type { Facts } from "../../src/core/countries/types.ts";

const PAUSE_MS = 1000;

/** Optional on-disk cache (FLAG_CACHE=dir) so rebuilds while tuning do not refetch every flag. */
async function svgOf(fetchFn: typeof fetch, iso2: string, url: string): Promise<string> {
  const dir = process.env.FLAG_CACHE;
  const file = dir ? join(dir, `${iso2}.svg`) : "";

  if (dir && existsSync(file)) return readFileSync(file, "utf8");

  const svg = await fetchFlagSvg(fetchFn, url);

  if (dir) writeFileSync(file, svg);

  await new Promise((resolve) => setTimeout(resolve, PAUSE_MS));

  return svg;
}

/** One flag at a time: Commons answers 429 to anything faster. */
async function detectColours(fetchFn: typeof fetch, urls: Map<string, string>) {
  const out = new Map<string, Facts["flagColours"]>();

  for (const [iso2, url] of urls) {
    try {
      out.set(iso2, coloursFromSvg(await svgOf(fetchFn, iso2, url)));
    } catch (err) {
      console.warn(`flag ${iso2} failed: ${String(err)}`);
    }
  }

  return out;
}

/** Wikidata facts for the snapshot countries with flag colours (SVG) and features (overrides) added. */
export async function gatherFacts(
  fetchFn: typeof fetch,
  snapshot: ReadonlySet<string>,
): Promise<Map<string, Facts>> {
  const json = await fetchFacts(fetchFn, FACT_QUERIES);
  const facts = parseFacts(json, snapshot);
  const urls = flagUrls(json);

  applyPatches(facts);

  const colours = await detectColours(
    fetchFn,
    new Map([...urls].filter(([iso2]) => snapshot.has(iso2))),
  );

  for (const [iso2, f] of facts) {
    const final = applyOverrides(iso2, colours.get(iso2) ?? []);

    f.flagColours = final.colours;
    f.flagFeatures = final.features;
  }

  return facts;
}
