import type { Excerpt } from "../../core/excerpt.ts";
import type { SearchResult } from "../../core/search.ts";

/** Pages read per search, at once: the first is often an index, the second the session page. */
const PAGES = 2;

/** One page's text as the model gets it. */
export interface Page {
  url: string;
  text: string;
}

export type ReadPage = (url: string, query: string) => Promise<Excerpt>;

const isArticle = (r: SearchResult): boolean => {
  const url = URL.parse(r.url);

  return url !== null && /^https?:$/.test(url.protocol) && url.pathname.length > 1;
};

/** The results whose pages are read: the first web pages that aren't a site's front page. */
export const pickPages = (results: SearchResult[]): SearchResult[] =>
  results.filter(isArticle).slice(0, PAGES);

/** Reads the picked pages together and keeps the excerpt that matches the query best, if any. */
export async function bestPage(
  read: ReadPage,
  results: SearchResult[],
  query: string,
): Promise<Page | null> {
  const picked = pickPages(results);
  const excerpts = await Promise.all(picked.map(async (r) => read(r.url, query)));
  let best: Page | null = null;
  let top = 0;

  excerpts.forEach((e, i) => {
    const url = picked[i]?.url;

    if (url && e.text && e.score > top) {
      best = { url, text: e.text };
      top = e.score;
    }
  });

  return best;
}
