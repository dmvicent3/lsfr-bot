import { chapterNumber } from "../poll/number.ts";
import { collection } from "./body.ts";
import { CONTENT_RATINGS, LANGUAGE } from "./constants.ts";
import { parseChapter } from "./parse-chapter.ts";
import type { MangaDexGet } from "./types.ts";

/** The highest English chapter number readable now (scheduled ones excluded); null when none. */
export async function latestChapter(get: MangaDexGet, mangaId: string): Promise<number | null> {
  const body = await get(`/manga/${mangaId}/feed`, {
    "translatedLanguage[]": [LANGUAGE],
    "order[chapter]": "desc",
    includeFutureUpdates: "0",
    limit: "1",
    "contentRating[]": CONTENT_RATINGS,
  });
  const [first] = collection(body).data;
  const chapter = first ? parseChapter(first) : null;

  return chapter ? chapterNumber(chapter.number) : null;
}
