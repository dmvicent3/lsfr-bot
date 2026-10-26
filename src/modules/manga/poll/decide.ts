import type { Chapter } from "../api/types.ts";
import { chapterNumber } from "./number.ts";
import type { Post, Seen } from "./types.ts";

/** Above this many new chapters in one run, they are one post. */
const COLLAPSE_ABOVE = 5;

/** New numbers above the highest seen, the earliest upload of each, in number order. */
function pickNumbered(chapters: Chapter[], highest: number | null): [number, Chapter][] {
  const first = new Map<number, Chapter>();

  for (const c of chapters) {
    const n = chapterNumber(c.number);

    if (n === null || (highest !== null && n <= highest)) continue;

    const kept = first.get(n);

    if (!kept || c.readableAt < kept.readableAt) first.set(n, c);
  }

  return [...first.entries()].toSorted(([a], [b]) => a - b);
}

function numberedPosts(picked: [number, Chapter][]): Post[] {
  const last = picked.at(-1);

  if (last && picked.length > COLLAPSE_ABOVE) {
    return [{ chapters: picked.map(([, c]) => c), highest: last[0], unnumberedId: null }];
  }

  return picked.map(([n, c]) => ({ chapters: [c], highest: n, unnumberedId: null }));
}

/**
 * One series' posts: each new chapter number once (posted in number order, so `highest` only
 * rises), then oneshots not posted before. A bulk upload of more than five is one post.
 */
export function decide(chapters: Chapter[], seen: Seen): Post[] {
  const numbered = numberedPosts(pickNumbered(chapters, seen.highest));
  const highest = numbered.at(-1)?.highest ?? seen.highest;
  const oneshots = chapters
    .filter((c) => chapterNumber(c.number) === null && !seen.unnumbered.has(c.id))
    .map((c) => ({ chapters: [c], highest, unnumberedId: c.id }));

  return [...numbered, ...oneshots];
}
