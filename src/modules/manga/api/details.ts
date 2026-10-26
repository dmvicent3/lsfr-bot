import { collection } from "./body.ts";
import { CONTENT_RATINGS } from "./constants.ts";
import { parseManga } from "./parse-manga.ts";
import type { MangaDexGet, MangaInfo } from "./types.ts";

const CHUNK = 100;

/** Title, cover, author and latest upload of each manga, by id; unknown ids are absent. */
export async function mangaDetails(
  get: MangaDexGet,
  ids: string[],
): Promise<Map<string, MangaInfo>> {
  const found = new Map<string, MangaInfo>();

  for (let start = 0; start < ids.length; start += CHUNK) {
    const body = await get("/manga", {
      "ids[]": ids.slice(start, start + CHUNK),
      "includes[]": ["cover_art", "author"],
      "contentRating[]": CONTENT_RATINGS,
      limit: String(CHUNK),
    });

    for (const m of collection(body).data.map(parseManga)) if (m) found.set(m.id, m);
  }

  return found;
}
