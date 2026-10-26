import type { Embedder } from "../../core/embed/types.ts";
import type { Jev } from "../../core/jev/types.ts";
import type { Job } from "../../core/types.ts";
import { safely } from "../../core/scheduler.ts";
import { sendTo } from "../../core/send.ts";
import { runCycle } from "./cycle/cycle.ts";
import { fetchFeed } from "./feeds/fetch.ts";
import { RssRepo } from "./store/repo.ts";

export function rssJobs(jev: Jev, embedder: Embedder | null): Job[] {
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
              post: async (channelId, embed) =>
                (await sendTo(ctx.client, channelId, { embeds: [embed] }, "rss:post")).result,
              say: async (channelId, text) => {
                await sendTo(ctx.client, channelId, { content: text }, "rss:post");
              },
              now: () => Date.now(),
              embedder,
            }),
          );
        }
      },
    },
  ];
}
