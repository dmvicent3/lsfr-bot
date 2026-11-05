import { readFileSync } from "node:fs";

/** Once-per-process cache: the list never changes while the bot runs. */
let cache: readonly string[] | null = null;

/** Every possible answer, read once per process. */
export function loadAnswers(): readonly string[] {
  cache ??= readFileSync(new URL("answers.txt", import.meta.url), "utf8")
    .split("\n")
    .filter(Boolean);

  return cache;
}
