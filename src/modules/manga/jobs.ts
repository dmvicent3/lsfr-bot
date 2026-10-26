import { log } from "../../core/log.ts";
import { sendTo } from "../../core/send.ts";
import type { Ctx, Job } from "../../core/types.ts";
import type { MangaDexGet } from "./api/types.ts";
import { runPoll } from "./poll/run.ts";
import { mangaChannel } from "./settings.ts";
import { MangaRepo } from "./store/repo.ts";

async function poll(ctx: Ctx, get: MangaDexGet): Promise<void> {
  const channelId = mangaChannel(ctx.db);

  if (!channelId) return log.info("manga:poll", "no channel set; skipped");

  await runPoll({
    repo: new MangaRepo(ctx.db),
    get,
    send: (m) => sendTo(ctx.client, channelId, m, "manga:poll"),
    now: () => Date.now(),
  });
}

export function mangaJobs(get: MangaDexGet): Job[] {
  return [{ name: "poll", cron: "0 */4 * * *", runOnStart: true, run: (ctx) => poll(ctx, get) }];
}
