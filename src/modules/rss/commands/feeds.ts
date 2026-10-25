import { MessageFlags } from "discord.js";
import { fetchFeed } from "../feeds/fetch.ts";
import { FeedError } from "../feeds/parse.ts";
import { httpUrl } from "../feeds/urls.ts";
import { followFeed } from "../subscriptions.ts";
import { channelHint, type CommandCtx, type Handler, reply } from "./kit.ts";

const channel: Handler = async ({ i, guildId, repo }) => {
  const channelId = i.options.getChannel("channel")?.id ?? i.channelId;
  repo.servers.setChannel(guildId, channelId);
  await reply(i, `News will be posted in <#${channelId}>.`);
};

async function followOrExplain(c: CommandCtx, url: string): Promise<string> {
  const name = c.i.options.getString("name");
  try {
    const feed = await followFeed(
      c.repo,
      { guildId: c.guildId, url, name },
      { fetchFeed: (u) => fetchFeed(u), now: Date.now() },
    );
    return `Following **${feed.name}**. New articles will appear ${channelHint(c)}.`;
  } catch (err) {
    if (err instanceof FeedError) return `Couldn't follow that feed: ${err.message}`;
    throw err;
  }
}

const follow: Handler = async (c) => {
  const url = c.i.options.getString("url", true).trim();
  if (!httpUrl(url)) return reply(c.i, "That isn't an http(s) URL.");
  await c.i.deferReply({ flags: MessageFlags.Ephemeral });
  await reply(c.i, await followOrExplain(c, url));
};

const unfollow: Handler = async ({ i, guildId, repo }) => {
  const id = Number(i.options.getString("feed", true));
  const removed = Number.isInteger(id) && repo.unfollow(guildId, id);
  await reply(i, removed ? "Unfollowed." : "No such feed; pick one from the list.");
};

const failing = (n: number): string => (n > 0 ? ` ⚠️ failing (${n} in a row)` : "");

const feeds: Handler = async (c) => {
  const list = c.repo.feeds.list(c.guildId);
  if (list.length === 0) return reply(c.i, "No feeds yet. Add one with `/rss follow`.");
  const lines = list.map((f) => `- **${f.name}** <${f.url}>${failing(f.failures)}`);
  await reply(c.i, `Posting ${channelHint(c)}:\n${lines.join("\n")}`.slice(0, 2000));
};

export const feedHandlers: Record<string, Handler> = { channel, follow, unfollow, feeds };
