import type { SearchResult } from "../../core/search.ts";
import { matchWords, terms } from "../../core/terms.ts";

/** Fewer words than this reads as a follow-up ("and the qualifying?") that needs its question. */
const FOLLOW_UP_WORDS = 6;

/**
 * What jev judges and SearXNG searches for the newest message: its own text, with the last
 * earlier user message before it when it is a short follow-up. No text means no search.
 */
export function searchQuery(newest: string, earlier: string[]): string {
  const text = newest.trim();
  const before = earlier.findLast((t) => t.trim() !== "");

  if (!text || !before || text.split(/\s+/).length >= FOLLOW_UP_WORDS) return text;

  return `${before.trim()} ${text}`;
}

/** What the search engine gets: the message's lookup words, plus the year when it names none. */
export function webQuery(query: string, year: string): string {
  const words = terms(query);

  return (words.some((w) => /^\d{4}$/.test(w)) ? words : [...words, year]).join(" ");
}

/**
 * The results whose title, link or snippet match at least half the question's lookup words
 * (rounded up, and both when it has two; other spellings count); search engines pad thin queries
 * with unrelated pages.
 */
export function relevantTo(results: SearchResult[], query: string): SearchResult[] {
  const asked = terms(query).length;
  const needed = Math.max(Math.min(asked, 2), Math.ceil(asked / 2));
  const words = matchWords(query);

  return results.filter((r) => {
    const text = `${r.title} ${r.url} ${r.snippet}`.toLowerCase();

    return words.filter((w) => text.includes(w)).length >= needed;
  });
}
