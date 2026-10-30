import { readFileSync } from "node:fs";
import { blanksIn } from "../text.ts";
import type { Card, Deck, Prompt } from "../types.ts";

interface RawDeck {
  prompts: string[];
  answers: string[];
}

/** Once per process: the bundled deck never changes while the bot runs. */
let cache: Deck | null = null;

export const asPrompt = (id: string, text: string): Prompt => ({
  id,
  text,
  blanks: blanksIn(text) === 2 ? 2 : 1,
});

export function starterDeck(): Deck {
  if (cache) return cache;

  const raw: RawDeck = JSON.parse(readFileSync(new URL("deck.json", import.meta.url), "utf8"));
  const answers: Card[] = raw.answers.map((text, i) => ({ id: `s:a${i}`, text }));
  cache = { prompts: raw.prompts.map((text, i) => asPrompt(`s:p${i}`, text)), answers };

  return cache;
}
