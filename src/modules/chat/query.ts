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
