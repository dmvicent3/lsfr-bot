import { parseFeed } from "../feeds/parse.ts";
import { itemKey } from "../feeds/urls.ts";
import type { Feed } from "../store/feeds.ts";
import type { Server } from "../store/servers.ts";
import type { CycleDeps } from "./cycle.ts";
import { expiryCutoff, feedResult } from "./decisions.ts";

const reason = (err: unknown): string => (err instanceof Error ? err.message : String(err));

/** Stores a feed's new items as pending; ones dated over a day ago are seen but never posted. */
async function storeItems(server: Server, feed: Feed, d: CycleDeps): Promise<void> {
  const cutoff = expiryCutoff(d.now());
  for (const item of parseFeed(await d.fetchFeed(feed.url)).items) {
    const key = itemKey(item);
    if (!key) continue;
    const stale = item.publishedAt !== null && item.publishedAt < cutoff;
    const state = stale ? "expired" : "pending";
    d.repo.items.insert({
      guildId: server.guildId,
      feedId: feed.id,
      key,
      item,
      state,
      now: d.now(),
    });
  }
}

/** Records the fetch outcome; the 10th failure in a row is told to the channel. */
async function record(server: Server, feed: Feed, failure: string | null, d: CycleDeps) {
  const next = feedResult(feed, failure === null);
  if (next.failures !== feed.failures || next.warned !== feed.warned) {
    d.repo.feeds.recordResult(feed.id, next.failures, next.warned);
  }
  if (next.warn)
    await d.say(server.channelId, `⚠️ Feed **${feed.name}** keeps failing: ${failure}`);
}

/** Fetches every feed of the server; one failing feed never stops the others. */
export async function collect(server: Server, feeds: Feed[], d: CycleDeps): Promise<void> {
  for (const feed of feeds) {
    const failure = await storeItems(server, feed, d).then(
      () => null,
      (err: unknown) => reason(err),
    );
    await record(server, feed, failure, d);
  }
}
