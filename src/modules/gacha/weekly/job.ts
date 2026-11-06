import { safely } from "../../../core/scheduler.ts";
import { sendTo } from "../../../core/send.ts";
import type { Ctx, Job } from "../../../core/types.ts";
import { ROSTER } from "../data/roster.ts";
import { GachaRepo } from "../store/repo.ts";
import { ensureBanner } from "./ensure.ts";
import { postPollsIfDue } from "./polls.ts";
import type { WeeklyDeps } from "./types.ts";

/** The weekly work's dependencies as of now, from the bot's context. */
export const weeklyDeps = (ctx: Ctx, random: () => number): WeeklyDeps => ({
  repo: new GachaRepo(ctx.db),
  roster: ROSTER,
  rest: ctx.client.rest,
  send: (channelId, message) => sendTo(ctx.client, channelId, message, "gacha:banner"),
  now: Date.now(),
  random,
});

/**
 * Every 5 minutes, per server the bot is in: start the week's banner once Monday comes (reading
 * last week's polls), and post next week's polls once Thursday noon passes. Both are no-ops once
 * done, so the reset lands within 5 minutes of midnight and a restart catches up.
 */
export const weeklyJob = (random: () => number): Job => ({
  name: "week",
  cron: "*/5 * * * *",
  runOnStart: true,
  async run(ctx) {
    for (const guildId of ctx.client.guilds.cache.keys()) {
      const d = weeklyDeps(ctx, random);
      await safely(`gacha:week:${guildId}`, async () => {
        await ensureBanner(d, guildId);
        await postPollsIfDue(d, guildId);
      });
    }
  },
});
