import { MessageFlags } from "discord.js";
import type { ComponentHandler } from "../../core/module.ts";
import { notFollowedText, togglePings, toggleReminder } from "./actions.ts";
import { deleteSeriesChannel } from "./channels.ts";
import { MotorsportRepo } from "./repo.ts";
import { isSeriesKey, seriesInfo } from "./series.ts";
import type { SeriesKey } from "./types.ts";

function seriesArg(args: string[]): SeriesKey {
  const value = args[0] ?? "";
  if (!isSeriesKey(value)) throw new Error(`Unknown series ${value}`);
  return value;
}

const pings: ComponentHandler = {
  id: "motorsport:pings",
  async handle(i, args, ctx) {
    const guild = await ctx.client.guilds.fetch(ctx.config.guildId);
    const text = await togglePings(guild, new MotorsportRepo(ctx.db), i.user.id, seriesArg(args));
    await i.reply({ content: text, flags: MessageFlags.Ephemeral });
  },
};

const remind: ComponentHandler = {
  id: "motorsport:remind",
  async handle(i, args, ctx) {
    if (!i.isStringSelectMenu()) return;
    const sessionId = i.values[0] ?? "";
    const text = toggleReminder(
      new MotorsportRepo(ctx.db),
      i.user.id,
      seriesArg(args),
      args[1] ?? null,
      sessionId,
      Date.now(),
    );
    await i.reply({ content: text, flags: MessageFlags.Ephemeral });
  },
};

const unfollow: ComponentHandler = {
  id: "motorsport:unfollow",
  async handle(i, args, ctx) {
    const series = seriesArg(args);
    const repo = new MotorsportRepo(ctx.db);
    const followed = repo.getFollowed(series);
    if (!followed) {
      await i.update({ content: notFollowedText(series), components: [] });
      return;
    }
    await i.deferUpdate();
    const guild = await ctx.client.guilds.fetch(ctx.config.guildId);
    await deleteSeriesChannel(guild, followed);
    repo.deleteSeries(series);
    await i.editReply({ content: `Unfollowed ${seriesInfo(series).name}.`, components: [] });
  },
};

export const motorsportComponents: ComponentHandler[] = [pings, remind, unfollow];
