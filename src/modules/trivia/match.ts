import { levenshtein } from "../../core/levenshtein.ts";

/** User, role and channel mentions and custom emoji: `<@1>`, `<@!1>`, `<@&1>`, `<#1>`, `<:name:1>`. */
const DISCORD_TOKENS = /<(?:@[!&]?|#)\d+>|<a?:\w+:\d+>/g;

export { levenshtein };

const TYPO_MIN_LETTERS = 6;

/** Lowercase letters and digits only, single-spaced, without a leading "the", "a" or "an". */
export function normalize(text: string): string {
  return text
    .replace(DISCORD_TOKENS, " ")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/^(?:the|a|an) /, "");
}

/** Equal after normalising; answers of 6+ letters and no digits also take one typo. */
export function matches(guess: string, answer: string): boolean {
  const g = normalize(guess);
  const a = normalize(answer);

  if (g === "" || a === "") return false;

  if (g === a) return true;

  const letters = a.replace(/ /g, "").length;

  return letters >= TYPO_MIN_LETTERS && !/\d/.test(a) && levenshtein(g, a) === 1;
}
