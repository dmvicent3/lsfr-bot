import type { MessageCreateOptions } from "discord.js";
import { log } from "../../core/log.ts";
import { sendTo } from "../../core/send.ts";
import type { Ctx, Job } from "../../core/types.ts";
import { runDue } from "./due.ts";
import { ReminderStore } from "./store/reminders.ts";

async function dm(ctx: Ctx, userId: string, m: MessageCreateOptions): Promise<boolean> {
  try {
    const user = await ctx.client.users.fetch(userId);
    await user.send(m);

    return true;
  } catch (err) {
    log.error("reminders:dm", `DM to ${userId} failed`, err);

    return false;
  }
}

export const remindersJobs: Job[] = [
  {
    name: "due",
    cron: "* * * * *",
    runOnStart: true,
    run: (ctx) =>
      runDue({
        store: new ReminderStore(ctx.db),
        send: (channelId, m) => sendTo(ctx.client, channelId, m, "reminders:due"),
        dm: (userId, m) => dm(ctx, userId, m),
        guildName: (id) => ctx.client.guilds.cache.get(id)?.name ?? "a server",
        roleExists: (guildId, roleId) =>
          ctx.client.guilds.cache.get(guildId)?.roles.cache.has(roleId) ?? true,
        now: () => Date.now(),
      }),
  },
];
