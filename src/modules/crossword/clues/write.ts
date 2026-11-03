import { clip } from "../../../core/clip.ts";
import { leaks } from "../words/leak.ts";
import { parseClues } from "./parse.ts";
import { type ClueEntry, cluePrompt } from "./prompt.ts";

export const CLUE_MAX = 90;

type Ask = (prompt: string) => Promise<string>;

/** Definition without a leading "(…) " note, capped at CLUE_MAX with an ellipsis. */
const fromDefinition = (def: string): string => {
  const text = def.replace(/^\([^)]*\)\s*/, "").trim();

  return clip(text, CLUE_MAX);
};

const usable = (clue: string | undefined, word: string): clue is string =>
  !!clue && clue.length <= CLUE_MAX && !leaks(clue, word);

/** Resolves with the answer, or "" if ask fails or exceeds timeoutMs (a late answer is ignored). */
async function askWithin(ask: Ask, prompt: string, timeoutMs: number): Promise<string> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<string>((resolve) => {
    timer = setTimeout(() => resolve(""), timeoutMs);
  });

  try {
    return await Promise.race([ask(prompt), timeout]);
  } catch {
    return "";
  } finally {
    clearTimeout(timer);
  }
}

/** One clue per entry, in order: the LLM's when valid, otherwise the cleaned definition. */
export async function writeClues(
  entries: ClueEntry[],
  ask: Ask | null,
  timeoutMs = 60_000,
): Promise<string[]> {
  const reply = ask ? await askWithin(ask, cluePrompt(entries), timeoutMs) : "";
  const clues = parseClues(reply);

  return entries.map((e) => {
    const clue = clues.get(e.word.toUpperCase());

    return usable(clue, e.word) ? clue : fromDefinition(e.def);
  });
}
