import { chapterNumber } from "../poll/number.ts";
import { collection } from "./body.ts";
import { CONTENT_RATINGS, LANGUAGE } from "./constants.ts";
import { parseChapter } from "./parse-chapter.ts";
import type { MangaDexGet } from "./types.ts";

/** The highest English chapter number of a manga; null when it has none. */
export async function latestChapter(get: MangaDexGet, mangaId: string): Promise<number | null> {
  const body = await get(`/manga/${mangaId}/feed`, {
    "translatedLanguage[]": [LANGUAGE],
    "order[chapter]": "desc",
    limit: "1",
    "contentRating[]": CONTENT_RATINGS,
  });
  const [first] = collection(body).data;
  const chapter = first ? parseChapter(first) : null;

  return chapter ? chapterNumber(chapter.number) : null;
}
