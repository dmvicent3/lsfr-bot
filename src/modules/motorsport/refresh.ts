import type { FetchFn } from "../../core/guards.ts";
import { log } from "../../core/log.ts";
import type { MotorsportRepo } from "./repo.ts";
import { applyRules } from "./rules.ts";
import { SERIES } from "./series.ts";
import { fetchSeries } from "./sources/fetch.ts";
import type { SeriesKey } from "./types.ts";

export interface RefreshResult {
  series: SeriesKey;
  ok: boolean;
  error?: string;
}

/**
 * Fetches this year's and next year's schedule for every series. A series whose fetch or
 * parse fails keeps its previous sessions.
 */
export async function refreshAll(
  repo: MotorsportRepo,
  now: Date,
  fetchFn: FetchFn = fetch,
): Promise<RefreshResult[]> {
  const year = now.getUTCFullYear();
  return Promise.all(
    SERIES.map(async (info): Promise<RefreshResult> => {
      try {
        const years = await Promise.all([
          fetchSeries(info, year, fetchFn),
          fetchSeries(info, year + 1, fetchFn),
        ]);
        repo.replaceSessions(info.key, applyRules(years.flat()), now.getTime());
        return { series: info.key, ok: true };
      } catch (err) {
        log.error("motorsport:refresh", `${info.key} failed, keeping previous schedule`, err);
        return { series: info.key, ok: false, error: String(err) };
      }
    }),
  );
}
