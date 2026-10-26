import { log } from "../../../core/log.ts";
import type { SendResult } from "../../../core/types.ts";
import { mangaFeed } from "../api/feed.ts";
import type { Chapter, MangaInfo } from "../api/types.ts";
import type { Series } from "../store/types.ts";
import { decide } from "./decide.ts";
import { renderPost } from "./render.ts";
import type { CheckResult, PollDeps, Post } from "./types.ts";

/** Feeds are read from an hour before the last check, so a late-indexed chapter isn't missed. */
const OVERLAP_MS = 3_600_000;

async function feed(deps: PollDeps, s: Series): Promise<Chapter[] | null> {
  try {
    return await mangaFeed(deps.get, s.id, s.checkedAt - OVERLAP_MS);
  } catch (err) {
    log.error("manga:poll", `feed of ${s.id} failed`, err);

    return null;
  }
}

/** Sends a post's messages; the first one (with the embed) decides. Stores it once sent. */
async function sendPost(deps: PollDeps, p: Post, manga: MangaInfo): Promise<SendResult["result"]> {
  const [first, ...rest] = renderPost(p, manga, deps.repo.follows.followers(manga.id));

  if (!first) return "ok";

  const { result } = await deps.send(first);

  if (result !== "ok") return result;

  for (const m of rest) await deps.send(m);

  if (p.highest !== null) deps.repo.series.setHighest(manga.id, p.highest);

  if (p.unnumberedId) deps.repo.unnumbered.add(p.unnumberedId, deps.now());

  return "ok";
}

const SEND_FAILED: Record<"lost-channel" | "failed", CheckResult> = {
  "lost-channel": "channel-lost",
  failed: "send-failed",
};

/** One series: its new chapters posted, then the check stored (left as is when a send fails). */
export async function checkSeries(
  deps: PollDeps,
  s: Series,
  manga: MangaInfo,
  startedAt: number,
): Promise<CheckResult> {
  const chapters = await feed(deps, s);

  if (!chapters) return "fetch-failed";

  const seen = { highest: s.highest, unnumbered: deps.repo.unnumbered.ids() };

  for (const p of decide(chapters, seen)) {
    const result = await sendPost(deps, p, manga);

    if (result !== "ok") return SEND_FAILED[result];
  }

  deps.repo.series.markChecked(s.id, {
    title: manga.title,
    latestUpload: manga.latestUpload,
    checkedAt: startedAt,
  });

  return "ok";
}
