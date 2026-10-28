/**
 * Builds src/modules/word/words/{answers,accepted}-<n>.txt for n = 4-7.
 * Usage: bun scripts/build-word-lists.ts <enable1.txt> <en_50k.txt>
 * Sources: github.com/dolph/dictionary enable1.txt (public domain) and
 * github.com/hermitdave/FrequencyWords content/2018/en/en_50k.txt ("word count" lines).
 */
import { readFileSync, writeFileSync } from "node:fs";

const LENGTHS = [4, 5, 6, 7];
const COMMON = 30_000;
const OUT = new URL("../src/modules/word/words/", import.meta.url);

const lines = (path: string): string[] => readFileSync(path, "utf8").split(/\r?\n/);

const [enablePath, frequencyPath] = process.argv.slice(2);

if (!enablePath || !frequencyPath) throw new Error("usage: build-word-lists <enable1> <en_50k>");

const enable = new Set(lines(enablePath).map((w) => w.trim()));
const common = new Set(
  lines(frequencyPath)
    .slice(0, COMMON)
    .map((l) => l.split(" ")[0] ?? ""),
);
/** Kept out of the answers (still fine as guesses): slurs, sex, bodily and cruel words, words mostly used as names. */
const blocked = new Set(
  readFileSync(new URL("word-blocklist.txt", import.meta.url), "utf8")
    .split(/\s+/)
    .filter(Boolean),
);
/** Words that are only the plural of a shorter accepted word. */
const isPlural = (w: string): boolean => w.endsWith("s") && enable.has(w.slice(0, -1));

const write = (name: string, words: string[]): void =>
  writeFileSync(new URL(name, OUT), `${words.toSorted().join("\n")}\n`);

for (const n of LENGTHS) {
  const shape = new RegExp(`^[a-z]{${n}}$`);
  const accepted = [...enable].filter((w) => shape.test(w));
  write(`accepted-${n}.txt`, accepted);
  write(
    `answers-${n}.txt`,
    accepted.filter((w) => common.has(w) && !isPlural(w) && !blocked.has(w)),
  );
}
