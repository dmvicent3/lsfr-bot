import { collection } from "./body.ts";
import { CONTENT_RATINGS, LANGUAGE } from "./constants.ts";
import { parseChapter } from "./parse-chapter.ts";
import type { Chapter, MangaDexGet } from "./types.ts";

const PAGE = 100;

/** MangaDex wants YYYY-MM-DDTHH:mm:ss in UTC, without millis or zone. */
const since = (at: number): string => new Date(at).toISOString().slice(0, 19);

/** A manga's English chapters readable since `sinceAt`, oldest first, every page. */
export async function mangaFeed(
  get: MangaDexGet,
  mangaId: string,
  sinceAt: number,
): Promise<Chapter[]> {
  const chapters: Chapter[] = [];

  for (let offset = 0, total = 1; offset < total; offset += PAGE) {
    const page = collection(
      await get(`/manga/${mangaId}/feed`, {
        "translatedLanguage[]": [LANGUAGE],
        readableAtSince: since(sinceAt),
        includeFutureUpdates: "0",
        "order[readableAt]": "asc",
        "includes[]": ["scanlation_group"],
        "contentRating[]": CONTENT_RATINGS,
        limit: String(PAGE),
        offset: String(offset),
      }),
    );
    total = page.total;
    chapters.push(...page.data.map(parseChapter).filter((c) => c !== null));
  }

  return chapters;
}
