import { MessageFlags } from "discord.js";
import type { ComponentHandler } from "../../core/module.ts";
import { notFollowedText, setReminders, togglePings } from "./actions.ts";
import { deleteSeriesChannel } from "./channels.ts";
import { groupEvents } from "./decisions.ts";
import { renderReminderPicker } from "./render.ts";
import { MotorsportRepo } from "./repo.ts";
import { isSeriesKey, seriesInfo } from "./series.ts";
import type { EventSchedule, SeriesKey } from "./types.ts";

function seriesArg(args: string[]): SeriesKey {
  const value = args[0] ?? "";
  if (!isSeriesKey(value)) throw new Error(`Unknown series ${value}`);
  return value;
}

const pings: ComponentHandler = {
  id: "motorsport:pings",
  async handle(i, args, ctx) {
    await i.deferReply({ flags: MessageFlags.Ephemeral });
    const guild = await ctx.client.guilds.fetch(ctx.config.guildId);
    const text = await togglePings(guild, new MotorsportRepo(ctx.db), i.user.id, seriesArg(args));
    await i.editReply(text);
  },
};

function eventOf(repo: MotorsportRepo, series: SeriesKey, eventId: string): EventSchedule | null {
  return groupEvents(repo.listSessions(series)).find((e) => e.eventId === eventId) ?? null;
}

/** "Remind me…" button: opens the viewer's private reminder picker for that event. */
const remindMenu: ComponentHandler = {
  id: "motorsport:remindmenu",
  async handle(i, args, ctx) {
    const series = seriesArg(args);
    const repo = new MotorsportRepo(ctx.db);
    const event = eventOf(repo, series, args[1] ?? "");
    if (!repo.getFollowed(series) || !event) {
      await i.reply({
        content: "That event isn't on the schedule any more.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    const selected = new Set(repo.userOneOffs(i.user.id, series, event.eventId));
    const picker = renderReminderPicker(seriesInfo(series), event, selected, Date.now());
    await i.reply({ ...picker, flags: MessageFlags.Ephemeral });
  },
};

/** The picker's multi-select: the submitted values become the user's reminders. */
const reminders: ComponentHandler = {
  id: "motorsport:reminders",
  async handle(i, args, ctx) {
    if (!i.isStringSelectMenu()) return;
    const series = seriesArg(args);
    const eventId = args[1] ?? "";
    const repo = new MotorsportRepo(ctx.db);
    const now = Date.now();
    const text = setReminders(repo, i.user.id, series, eventId, i.values, now);
    const event = eventOf(repo, series, eventId);
    const selected = new Set(repo.userOneOffs(i.user.id, series, eventId));
    const picker = event ? renderReminderPicker(seriesInfo(series), event, selected, now) : null;
    await i.update({ content: text, components: picker?.components ?? [] });
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

export const motorsportComponents: ComponentHandler[] = [pings, remindMenu, reminders, unfollow];
