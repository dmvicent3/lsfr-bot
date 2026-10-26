import { mangaDetails } from "./api/details.ts";
import { latestChapter } from "./api/latest.ts";
import type { Series } from "./store/types.ts";
import type { FollowDeps, FollowRequest, FollowResult } from "./types.ts";

export const MAX_FOLLOWS = 100;

/**
 * A manga's series row, made on its first follow: it starts at its latest English chapter and
 * the follow time, so only chapters after it are posted. Null when MangaDex doesn't know it.
 */
async function seriesFor(deps: FollowDeps, mangaId: string): Promise<Series | null> {
  const known = deps.repo.series.get(mangaId);

  if (known) return known;

  const manga = (await mangaDetails(deps.get, [mangaId])).get(mangaId);

  if (!manga) return null;

  const created = {
    id: manga.id,
    title: manga.title,
    highest: await latestChapter(deps.get, manga.id),
    latestUpload: manga.latestUpload,
    checkedAt: deps.now,
  };
  deps.repo.series.add(created);

  return created;
}

/** Text typed instead of picking from autocomplete isn't an id; MangaDex would answer 400. */
const MANGA_ID = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;

export async function followManga(deps: FollowDeps, req: FollowRequest): Promise<FollowResult> {
  if (!MANGA_ID.test(req.mangaId)) return { kind: "not-found" };

  const known = deps.repo.series.get(req.mangaId);

  if (known && deps.repo.follows.followers(known.id).includes(req.userId)) {
    return { kind: "already", title: known.title };
  }

  if (deps.repo.follows.count(req.userId) >= MAX_FOLLOWS) return { kind: "limit" };

  const series = await seriesFor(deps, req.mangaId);

  if (!series) return { kind: "not-found" };

  deps.repo.follows.add(series.id, req.userId);

  return { kind: "followed", title: series.title };
}
