import { collection } from "./body.ts";
import { CONTENT_RATINGS } from "./constants.ts";
import { parseManga } from "./parse-manga.ts";
import type { MangaDexGet, SearchHit } from "./types.ts";

/** Up to 25 manga matching `title`, most relevant first. */
export async function searchManga(get: MangaDexGet, title: string): Promise<SearchHit[]> {
  const body = await get("/manga", {
    title,
    limit: "25",
    "order[relevance]": "desc",
    "contentRating[]": CONTENT_RATINGS,
  });

  return collection(body)
    .data.map(parseManga)
    .filter((m) => m !== null)
    .map((m) => ({ id: m.id, title: m.title }));
}
