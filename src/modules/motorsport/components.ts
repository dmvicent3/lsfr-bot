import { MessageFlags } from "discord.js";
import { log } from "../../core/log.ts";
import type { ComponentHandler, Ctx } from "../../core/types.ts";
import { notFollowedText, setReminders, togglePings } from "./pings/actions.ts";
import { deleteSeriesChannel, fetchSeriesChannel, updatePinned } from "./channels/channels.ts";
import { predictPicker, savePick } from "./predictions/predict-actions.ts";
import { groupEvents, withoutPinged } from "./channels/decisions.ts";
import { renderReminderPicker } from "./pings/render.ts";
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
  const event = groupEvents(repo.sessions.list(series)).find((e) => e.eventId === eventId);
  return event ? withoutPinged(event, repo.pings.sentKeys(series)) : null;
}

/** "Remind me…" button: opens the viewer's private reminder picker for that event. */
const remindMenu: ComponentHandler = {
  id: "motorsport:remindmenu",
  async handle(i, args, ctx) {
    const series = seriesArg(args);
    const repo = new MotorsportRepo(ctx.db);
    const event = eventOf(repo, series, args[1] ?? "");
    if (!repo.followed.get(series) || !event) {
      await i.reply({
        content: "That event isn't on the schedule any more.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    const selected = new Set(repo.reminders.ofUser(i.user.id, series, event.eventId));
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
    const text = setReminders(repo, { userId: i.user.id, now }, { series, eventId }, i.values);
    const event = eventOf(repo, series, eventId);
    const selected = new Set(repo.reminders.ofUser(i.user.id, series, eventId));
    const picker = event ? renderReminderPicker(seriesInfo(series), event, selected, now) : null;
    await i.update({ content: text, components: picker?.components ?? [] });
  },
};

const asReply = (picker: Awaited<ReturnType<typeof predictPicker>>) =>
  typeof picker === "string" ? { content: picker, components: [] } : picker;

/** "Predict" on the pinned schedule, or a picker's button to switch to another session. */
const predictMenu: ComponentHandler = {
  id: "motorsport:predictmenu",
  async handle(i, args, ctx) {
    const series = seriesArg(args);
    const sessionId = args[2];
    // The live driver list may need fetching: acknowledge first.
    await (sessionId === undefined
      ? i.deferReply({ flags: MessageFlags.Ephemeral })
      : i.deferUpdate());
    const repo = new MotorsportRepo(ctx.db);
    const picker = await predictPicker(
      repo,
      { userId: i.user.id, now: Date.now() },
      { series, eventId: args[1] ?? "", sessionId },
      fetch,
    );
    await i.editReply(asReply(picker));
  },
};

/** Re-renders the pinned schedule so its prediction count is current. Best effort. */
async function refreshPinned(ctx: Ctx, repo: MotorsportRepo, series: SeriesKey): Promise<void> {
  try {
    const f = repo.followed.get(series);
    if (!f) return;
    const channel = await fetchSeriesChannel(await ctx.client.guilds.fetch(ctx.config.guildId), f);
    if (channel) await updatePinned(channel, repo, f, Date.now());
  } catch (err) {
    log.error("motorsport:predict", `${series} pinned refresh failed`, err);
  }
}

/** One of the picker's P1/P2/P3 selects: saves that position and re-renders the picker. */
const predict: ComponentHandler = {
  id: "motorsport:predict",
  async handle(i, args, ctx) {
    if (!i.isStringSelectMenu()) return;
    const series = seriesArg(args);
    const [, eventId = "", sessionId = "", index = ""] = args;
    const repo = new MotorsportRepo(ctx.db);
    const viewer = { userId: i.user.id, now: Date.now() };
    const outcome = savePick(
      repo,
      viewer,
      { series, eventId, sessionId },
      { index: Number(index), driverId: i.values[0] ?? "" },
    );
    if (!outcome.ok) {
      await i.update({ content: outcome.text, components: [] });
      return;
    }
    await i.deferUpdate();
    await i.editReply(
      asReply(await predictPicker(repo, viewer, { series, eventId, sessionId }, fetch)),
    );
    if (outcome.completed) await refreshPinned(ctx, repo, series);
  },
};

const unfollow: ComponentHandler = {
  id: "motorsport:unfollow",
  async handle(i, args, ctx) {
    const series = seriesArg(args);
    const repo = new MotorsportRepo(ctx.db);
    const followed = repo.followed.get(series);
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

export const motorsportComponents: ComponentHandler[] = [
  pings,
  remindMenu,
  reminders,
  predictMenu,
  predict,
  unfollow,
];
