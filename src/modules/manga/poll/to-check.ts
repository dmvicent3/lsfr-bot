import type { MangaInfo } from "../api/types.ts";
import type { Series } from "../store/types.ts";

const STALE_MS = 24 * 3_600_000;

/**
 * Series whose feed may have news: the latest upload changed, or a day passed (a chapter with a
 * future publish time becomes readable without the latest upload changing again).
 */
export function toCheck(series: Series[], details: Map<string, MangaInfo>, now: number): Series[] {
  return series.filter((s) => {
    const info = details.get(s.id);

    if (!info) return false;

    return info.latestUpload !== s.latestUpload || now - s.checkedAt > STALE_MS;
  });
}
