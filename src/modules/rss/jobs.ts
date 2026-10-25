import { type APIEmbed, DiscordAPIError, RESTJSONErrorCodes } from "discord.js";
import type { Jev } from "../../core/jev.ts";
import { log } from "../../core/log.ts";
import type { Ctx, Job } from "../../core/module.ts";
import { safely } from "../../core/scheduler.ts";
import { type PostResult, runCycle } from "./cycle/cycle.ts";
import { fetchFeed } from "./feeds/fetch.ts";
import { RssRepo } from "./store/repo.ts";

const LOST = new Set<unknown>([
  RESTJSONErrorCodes.MissingAccess,
  RESTJSONErrorCodes.UnknownChannel,
  RESTJSONErrorCodes.UnknownGuild,
]);

/** A send error: the channel or server gone is "lost-channel"; anything else is retried next cycle. */
export function sendFailure(err: unknown): PostResult {
  return err instanceof DiscordAPIError && LOST.has(err.code) ? "lost-channel" : "failed";
}

type Message = { embeds: APIEmbed[] } | { content: string };

/** Feed text is untrusted: a title like "@everyone" must not ping. */
export function outgoing(message: Message): Message & { allowedMentions: { parse: [] } } {
  return { ...message, allowedMentions: { parse: [] } };
}

/** Sends to a channel; a channel the bot can no longer use is "lost-channel". */
async function send(ctx: Ctx, channelId: string, message: Message): Promise<PostResult> {
  try {
    const channel = await ctx.client.channels.fetch(channelId);
    if (!channel?.isSendable()) return "lost-channel";
    await channel.send(outgoing(message));
    return "ok";
  } catch (err) {
    const result = sendFailure(err);
    if (result === "failed") log.error("rss:post", `send to ${channelId} failed`, err);
    return result;
  }
}

export function rssJobs(jev: Jev): Job[] {
  return [
    {
      name: "check",
      cron: "*/15 * * * *",
      async run(ctx) {
        const repo = new RssRepo(ctx.db);
        for (const server of repo.servers.list()) {
          await safely(`rss:${server.guildId}`, () =>
            runCycle(server, {
              repo,
              jev,
              fetchFeed: (url) => fetchFeed(url),
              post: (channelId, embed) => send(ctx, channelId, { embeds: [embed] }),
              say: async (channelId, text) => {
                await send(ctx, channelId, { content: text });
              },
              now: () => Date.now(),
            }),
          );
        }
      },
    },
  ];
}
