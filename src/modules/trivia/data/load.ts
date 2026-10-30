import { readFileSync } from "node:fs";
import type { KaosList, Question } from "../types.ts";

const read = <T>(name: string): T => JSON.parse(readFileSync(new URL(name, import.meta.url), "utf8"));

/** Once-per-process caches: the data never changes while the bot runs. */
let questionCache: readonly Question[] | null = null;
let kaosCache: readonly KaosList[] | null = null;

export function questions(): readonly Question[] {
  questionCache ??= read<Question[]>("questions.json");

  return questionCache;
}

export function kaosLists(): readonly KaosList[] {
  kaosCache ??= read<KaosList[]>("kaos.json");

  return kaosCache;
}
