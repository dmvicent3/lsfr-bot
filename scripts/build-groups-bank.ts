/**
 * Builds src/modules/groups/bank/bank.json from scripts/groups-bank/allowlist.txt.
 * Usage: bun scripts/build-groups-bank.ts <wndb-dir> <en_50k.txt>
 * Sources: WordNet 3.0 WNDB dict files (index.noun / data.noun) and FrequencyWords 2018 en_50k
 * (github.com/hermitdave/FrequencyWords).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { parseAllowlist } from "./groups-bank/allowlist.ts";
import { buildBank } from "./groups-bank/bank.ts";
import { readNouns } from "./groups-bank/wndb.ts";

const OUT = new URL("../src/modules/groups/bank/bank.json", import.meta.url);
const text = (path: string | URL): string => readFileSync(path, "utf8");

const [wndbDir, frequencyPath] = process.argv.slice(2);

if (!wndbDir || !frequencyPath) throw new Error("usage: build-groups-bank <wndb-dir> <en_50k>");

const rank = new Map<string, number>();

for (const [i, line] of text(frequencyPath).split(/\r?\n/).entries()) {
  const word = line.split(" ")[0] ?? "";

  if (!rank.has(word)) rank.set(word, i);
}

const { bank, skipped } = buildBank(
  readNouns(wndbDir),
  {
    rank,
    blocked: new Set(
      text(new URL("word-blocklist.txt", import.meta.url))
        .split(/\s+/)
        .filter(Boolean),
    ),
  },
  parseAllowlist(text(new URL("groups-bank/allowlist.txt", import.meta.url))),
);

writeFileSync(OUT, `${JSON.stringify(bank).replaceAll("},{", "},\n{")}\n`);

for (const c of bank) console.log(`${c.level} ${c.name} [${c.words.length}]: ${c.words.join(" ")}`);

for (const s of skipped) console.log(`skipped ${s.id}: ${s.why}`);

const sizes = bank.map((c) => c.words.length);

console.log(`${bank.length} categories, ${Math.min(...sizes)}-${Math.max(...sizes)} words each`);
console.log(
  `per level: ${[0, 1, 2, 3].map((l) => bank.filter((c) => c.level === l).length).join(" ")}`,
);
