import { generate } from "../../core/llm.ts";
import type { FetchFn } from "../../core/types.ts";
import type { Ask } from "./play/make.ts";

const SYSTEM = "You write short, fair crossword clues. Answer only with the JSON asked for.";

/** The clue-writing call on the local model; null without a model URL (definitions are used). */
export function llmAsk(url: string | null, fetchFn?: FetchFn): Ask | null {
  if (!url) return null;

  return (prompt) => generate(prompt, { url, system: SYSTEM, ...(fetchFn ? { fetchFn } : {}) });
}
