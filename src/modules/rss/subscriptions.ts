import type { FollowRequest, FollowDeps } from "./types.ts";
import { FeedError, parseFeed } from "./feeds/parse.ts";
import { itemKey } from "./feeds/urls.ts";
import type { Rule, RuleKind } from "./rules/types.ts";
import type { Feed } from "./store/types.ts";
import type { RssRepo } from "./store/repo.ts";

/** Per server: each rule is one jev request per article. */
export const MAX_RULES = 25;
/** 25: a Discord select menu (the rule feed picker) holds at most 25 options. */
export const MAX_FEEDS = 25;
const MAX_NAME = 100;

export class RuleError extends Error {
  override name = "RuleError";
}

/** Follows a feed: it must parse, and its current items are stored as posted so none floods the channel. */
export async function followFeed(
  repo: RssRepo,
  { guildId, url, name }: FollowRequest,
  { fetchFeed, now }: FollowDeps,
): Promise<Feed> {
  const feeds = repo.feeds.list(guildId);
  if (feeds.some((f) => f.url === url)) {
    throw new FeedError("this server already follows that feed");
  }
  if (feeds.length >= MAX_FEEDS) {
    throw new FeedError(`a server can follow at most ${MAX_FEEDS} feeds`);
  }
  const parsed = parseFeed(await fetchFeed(url));
  const feedName = (name?.trim() || parsed.title || url).slice(0, MAX_NAME);
  const feed = repo.feeds.add(guildId, url, feedName);
  for (const item of parsed.items) {
    const key = itemKey(item);
    if (key) repo.items.insert({ guildId, feedId: feed.id, key, item, state: "posted", now });
  }
  return feed;
}

/** Adds a rule for every feed: not blank, at most MAX_RULES per server. */
export function addRule(repo: RssRepo, guildId: string, text: string, kind: RuleKind): Rule {
  const t = text.trim();
  if (!t) throw new RuleError("a rule can't be blank");
  if (repo.rules.list(guildId).length >= MAX_RULES) {
    throw new RuleError(`a server can have at most ${MAX_RULES} rules`);
  }
  return repo.rules.add(guildId, t, kind);
}
