/**
 * Builds src/modules/crossword/words/bank.json.
 * Usage: bun scripts/build-crossword-words.ts <enable1.txt> <en_50k.txt> <wndb-dir>
 * Sources: ENABLE (github.com/dolph/dictionary), FrequencyWords 2018 en_50k
 * (github.com/hermitdave/FrequencyWords) and WordNet WNDB dict files (index.* / data.*).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { buildBank } from "./crossword-words/bank.ts";
import { readDefinitions } from "./crossword-words/wndb.ts";

const COMMON = 30_000;
const OUT = new URL("../src/modules/crossword/words/bank.json", import.meta.url);

const lines = (path: string): string[] => readFileSync(path, "utf8").split(/\r?\n/);

const [enablePath, frequencyPath, wndbDir] = process.argv.slice(2);

if (!enablePath || !frequencyPath || !wndbDir) {
  throw new Error("usage: build-crossword-words <enable1> <en_50k> <wndb-dir>");
}

const bank = buildBank({
  enable: new Set(lines(enablePath).map((w) => w.trim())),
  frequent: lines(frequencyPath).map((l) => l.split(" ")[0] ?? ""),
  blocked: new Set(
    readFileSync(new URL("word-blocklist.txt", import.meta.url), "utf8")
      .split(/\s+/)
      .filter(Boolean),
  ),
  definitions: readDefinitions(wndbDir),
  common: COMMON,
});

writeFileSync(OUT, `${JSON.stringify(bank, null, 0).replaceAll("},{", "},\n{")}\n`);

for (const n of [3, 4, 5, 6, 7]) {
  console.log(`${n}: ${bank.filter((b) => b.word.length === n).length}`);
}

console.log(`total: ${bank.length}`);

for (let i = 0; i < 10; i++) {
  const b = bank[Math.floor((i * bank.length) / 10)];

  console.log(`${b?.word} (#${b?.rank}): ${b?.def}`);
}
