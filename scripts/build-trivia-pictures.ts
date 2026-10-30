/**
 * Builds src/modules/trivia/data/pictures.json from Wikidata (CC0) and Commons file names.
 * Usage: bun scripts/build-trivia-pictures.ts, then `bun run fmt`.
 * Re-runs keep each picture's id (matched by category and Wikidata item).
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { asText, isRecord, records } from "../src/core/guards.ts";
import { type PictureRow, toPictures } from "../src/modules/trivia/data/pictures.ts";
import type { Picture } from "../src/modules/trivia/types.ts";
import { CATEGORIES } from "./trivia-pictures-queries.ts";

const OUT = new URL("../src/modules/trivia/data/pictures.json", import.meta.url);
const SPARQL = "https://query.wikidata.org/sparql";
const HEADERS = {
  Accept: "application/sparql-results+json",
  "User-Agent": "GorkTriviaBuilder/1.0 (Gork Discord bot)",
};
/** Wikidata asks for a pause between heavy queries. */
const PAUSE_MS = 2_000;

const value = (b: Record<string, unknown>, key: string): string => {
  const cell = b[key];

  return isRecord(cell) ? asText(cell["value"]) : "";
};

const lastSegment = (url: string): string => decodeURIComponent(url.split("/").at(-1) ?? "");

function toRow(b: Record<string, unknown>): PictureRow {
  return {
    qid: lastSegment(value(b, "item")),
    label: value(b, "label"),
    image: lastSegment(value(b, "img")),
    links: Number(value(b, "links")),
    aliases: value(b, "alts").split("|").filter(Boolean),
  };
}

async function query(sparql: string): Promise<PictureRow[]> {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(`${SPARQL}?query=${encodeURIComponent(sparql)}`, { headers: HEADERS });
    const body: unknown = res.ok ? await res.json() : null;

    if (isRecord(body) && isRecord(body["results"]))
      return records(body["results"]["bindings"]).map(toRow);

    if (attempt >= 3) throw new Error(`query failed: ${res.status}`);

    await Bun.sleep(PAUSE_MS * 5);
  }
}

const previous: Picture[] = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : [];
const idOf = new Map(previous.map((p) => [`${p.category}:${p.qid}`, p.id]));
let next = Math.max(100_000, ...previous.map((p) => p.id)) + 1;
const all: Picture[] = [];

for (const c of CATEGORIES) {
  const rows: PictureRow[] = [];

  for (const q of c.queries) {
    rows.push(...(await query(q)));
    await Bun.sleep(PAUSE_MS);
  }

  const pictures = toPictures({ ...c, rows, previous: idOf, nextId: () => next++ });
  console.log(`${c.category}: ${pictures.length}`);
  all.push(...pictures);
}

writeFileSync(OUT, `${JSON.stringify(all.toSorted((a, b) => a.id - b.id))}\n`);
console.log(`wrote ${all.length} pictures`);
