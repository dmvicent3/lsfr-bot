import { type APIEmbed, DiscordAPIError, RESTJSONErrorCodes } from "discord.js";
import type { Jev } from "../../core/jev.ts";
import { log } from "../../core/log.ts";
import type { Ctx, Job } from "../../core/module.ts";
import { safely } from "../../core/scheduler.ts";
import { type PostResult, runCycle } from "./cycle.ts";
import { fetchFeed } from "./fetch.ts";
import { RssRepo } from "./repo.ts";

const LOST = new Set<unknown>([
  RESTJSONErrorCodes.MissingAccess,
  RESTJSONErrorCodes.UnknownChannel,
  RESTJSONErrorCodes.MissingPermissions,
  RESTJSONErrorCodes.UnknownGuild,
]);

/** Sends to a channel; a channel the bot can no longer use is "lost-channel". */
async function send(
  ctx: Ctx,
  channelId: string,
  message: { embeds: APIEmbed[] } | { content: string },
): Promise<PostResult> {
  try {
    const channel = await ctx.client.channels.fetch(channelId);
    if (!channel?.isSendable()) return "lost-channel";
    await channel.send(message);
    return "ok";
  } catch (err) {
    if (err instanceof DiscordAPIError && LOST.has(err.code)) return "lost-channel";
    log.error("rss:post", `send to ${channelId} failed`, err);
    return "failed";
  }
}

export function rssJobs(jev: Jev): Job[] {
  return [
    {
      name: "check",
      cron: "*/15 * * * *",
      async run(ctx) {
        const repo = new RssRepo(ctx.db);
        for (const server of repo.servers()) {
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
