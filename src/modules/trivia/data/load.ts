import { readFileSync } from "node:fs";
import type { KaosList, Question } from "../types.ts";

const text = (name: string): string => readFileSync(new URL(name, import.meta.url), "utf8");

/** Once-per-process caches: the data never changes while the bot runs. */
let questionCache: readonly Question[] | null = null;
let kaosCache: readonly KaosList[] | null = null;

export function questions(): readonly Question[] {
  questionCache ??= JSON.parse(text("questions.json"));

  return questionCache ?? [];
}

export function kaosLists(): readonly KaosList[] {
  kaosCache ??= JSON.parse(text("kaos.json"));

  return kaosCache ?? [];
}
