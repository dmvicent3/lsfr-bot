import { mangaDetails } from "../api/details.ts";
import { checkSeries } from "./check-series.ts";
import { toCheck } from "./to-check.ts";
import type { PollDeps } from "./types.ts";

const KEEP_UNNUMBERED_MS = 30 * 24 * 3_600_000;

/**
 * One poll: a pre-check of every followed manga, then a feed check of those that changed, one
 * after another; a failed send ends the run. A failing pre-check rejects.
 */
export async function runPoll(deps: PollDeps): Promise<void> {
  const startedAt = deps.now();
  deps.repo.unnumbered.prune(startedAt - KEEP_UNNUMBERED_MS);
  const followed = deps.repo.series.followed();

  if (followed.length === 0) return;

  const details = await mangaDetails(
    deps.get,
    followed.map((s) => s.id),
  );

  for (const s of toCheck(followed, details, startedAt)) {
    const manga = details.get(s.id);

    if (!manga) continue;

    if ((await checkSeries(deps, s, manga, startedAt)) === "send-failed") return;
  }
}
