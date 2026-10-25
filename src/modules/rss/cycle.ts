import type { APIEmbed } from "discord.js";
import { JevError, type Jev } from "../../core/jev.ts";
import { expiryCutoff, feedResult, type JevOutcome, notice } from "./decisions.ts";
import { itemKey } from "./dedupe.ts";
import { FeedError, parseFeed } from "./parse.ts";
import { renderItem } from "./render.ts";
import type { Feed, RssRepo, Server } from "./repo.ts";
import { articleState, buildQuestions, verdict } from "./rules.ts";

/** Articles classified per server per cycle; the rest wait for the next. */
export const MAX_CLASSIFY = 30;
const MAX_POST = 50;

export type PostResult = "ok" | "lost-channel" | "failed";

export interface CycleDeps {
  repo: RssRepo;
  jev: Jev;
  fetchFeed: (url: string) => Promise<string>;
  post: (channelId: string, embed: APIEmbed) => Promise<PostResult>;
  say: (channelId: string, text: string) => Promise<void>;
  now: () => number;
}

const DOWN = "⚠️ jev is down, new articles will be checked once it's back.";
const BACK = "✅ jev is back.";

function reason(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/** Fetches every feed of the server and stores the new items as pending. */
async function collect(server: Server, feeds: Feed[], d: CycleDeps): Promise<void> {
  for (const feed of feeds) {
    let failure: string | null = null;
    try {
      for (const item of parseFeed(await d.fetchFeed(feed.url)).items) {
        const key = itemKey(item);
        if (key) d.repo.insertItem(server.guildId, feed.id, key, item, "pending", d.now());
      }
    } catch (err) {
      failure = reason(err);
    }
    const next = feedResult(feed, failure === null);
    if (next.failures !== feed.failures || next.warned !== feed.warned) {
      d.repo.recordFeedResult(feed.id, next.failures, next.warned);
    }
    if (next.warn)
      await d.say(server.channelId, `⚠️ Feed **${feed.name}** keeps failing: ${failure}`);
  }
}

/** Classifies pending items, oldest first; stops at the first jev failure. */
async function classify(server: Server, d: CycleDeps): Promise<JevOutcome> {
  const rules = d.repo.rules(server.guildId);
  let outcome: JevOutcome = "unused";
  for (const item of d.repo.itemsIn(server.guildId, "pending", MAX_CLASSIFY)) {
    if (rules.length === 0) {
      d.repo.setState(item.id, "passed");
      continue;
    }
    try {
      const answers = await d.jev.yesNo(articleState(item), buildQuestions(rules));
      d.repo.setState(item.id, verdict(answers, rules).kind === "block" ? "blocked" : "passed");
      outcome = "ok";
    } catch (err) {
      if (!(err instanceof JevError)) throw err;
      return "failed";
    }
  }
  return outcome;
}

/** One check of one server: collect, expire, classify, notices, post. */
export async function runCycle(server: Server, d: CycleDeps): Promise<void> {
  const feeds = d.repo.feeds(server.guildId);
  await collect(server, feeds, d);
  d.repo.expire(server.guildId, expiryCutoff(d.now()));

  const change = notice(server.jevDown, await classify(server, d));
  if (change) {
    d.repo.setJevDown(server.guildId, change === "down");
    await d.say(server.channelId, change === "down" ? DOWN : BACK);
  }

  const names = new Map(feeds.map((f) => [f.id, f.name]));
  for (const item of d.repo.itemsIn(server.guildId, "passed", MAX_POST)) {
    const result = await d.post(
      server.channelId,
      renderItem(item, names.get(item.feedId) ?? "RSS"),
    );
    if (result === "ok") d.repo.setState(item.id, "posted");
    if (result === "lost-channel") {
      d.repo.setChannel(server.guildId, null);
      return;
    }
  }
}

/** Follows a feed: it must parse, and its current items are stored as posted so none floods the channel. */
export async function followFeed(
  repo: RssRepo,
  guildId: string,
  url: string,
  name: string | null,
  fetchFeed: (url: string) => Promise<string>,
  now: number,
): Promise<Feed> {
  if (repo.feeds(guildId).some((f) => f.url === url)) {
    throw new FeedError("this server already follows that feed");
  }
  const parsed = parseFeed(await fetchFeed(url));
  const feed = repo.addFeed(guildId, url, name?.trim() || parsed.title || url);
  for (const item of parsed.items) {
    const key = itemKey(item);
    if (key) repo.insertItem(guildId, feed.id, key, item, "posted", now);
  }
  return feed;
}
