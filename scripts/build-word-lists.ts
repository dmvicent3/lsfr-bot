/**
 * Builds src/modules/word/words/answers-<n>.txt for n = 4-7, accepted-<n>.txt for n = 2-10, and
 * src/modules/snake/words/answers.txt.
 * Usage: bun scripts/build-word-lists.ts <enable1.txt> <en_50k.txt>
 * Sources: github.com/dolph/dictionary enable1.txt (public domain) and
 * github.com/hermitdave/FrequencyWords content/2018/en/en_50k.txt ("word count" lines).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { snakeAnswers } from "./word-lists/snake-answers.ts";

const ANSWER_LENGTHS = [4, 5, 6, 7];
const ACCEPTED_LENGTHS = [2, 3, 4, 5, 6, 7, 8, 9, 10];
const COMMON = 30_000;
/** Snake answers come from fewer, more familiar words: its lengths run to 10 letters. */
const SNAKE_COMMON = 15_000;
const OUT = new URL("../src/modules/word/words/", import.meta.url);
const SNAKE_OUT = new URL("../src/modules/snake/words/answers.txt", import.meta.url);

const lines = (path: string): string[] => readFileSync(path, "utf8").split(/\r?\n/);

const [enablePath, frequencyPath] = process.argv.slice(2);

if (!enablePath || !frequencyPath) throw new Error("usage: build-word-lists <enable1> <en_50k>");

const enable = new Set(lines(enablePath).map((w) => w.trim()));
const frequent = lines(frequencyPath).map((l) => l.split(" ")[0] ?? "");
const common = new Set(frequent.slice(0, COMMON));
/**
 * Kept out of the answers (still fine as guesses): slurs, sex, bodily and cruel words, words
 * mostly used as names, and subtitle sound cues.
 */
const blocked = new Set(
  readFileSync(new URL("word-blocklist.txt", import.meta.url), "utf8")
    .split(/\s+/)
    .filter(Boolean),
);
/** Words that are only the plural of a shorter accepted word. */
const isPlural = (w: string): boolean => w.endsWith("s") && enable.has(w.slice(0, -1));

const sorted = (words: string[]): string => `${words.toSorted().join("\n")}\n`;

const write = (name: string, words: string[]): void =>
  writeFileSync(new URL(name, OUT), sorted(words));

const ofLength = (n: number, words: Iterable<string>): string[] => {
  const shape = new RegExp(`^[a-z]{${n}}$`);

  return [...words].filter((w) => shape.test(w));
};

/** Shorter frequent tokens are mostly initials and split contractions ("ll", "ve"), not words. */
const SHORTEST_FREQUENT = 4;

for (const n of ACCEPTED_LENGTHS) {
  /** Guesses: the dictionary plus any frequent word (newer words ENABLE lacks, names, slang). */
  const extra = n >= SHORTEST_FREQUENT ? ofLength(n, frequent) : [];
  write(`accepted-${n}.txt`, [...new Set([...ofLength(n, enable), ...extra])]);
}

for (const n of ANSWER_LENGTHS) {
  const answers = ofLength(n, enable).filter(
    (w) => common.has(w) && !isPlural(w) && !blocked.has(w),
  );
  write(`answers-${n}.txt`, answers);
}

writeFileSync(SNAKE_OUT, sorted(snakeAnswers({ enable, frequent, blocked, common: SNAKE_COMMON })));
