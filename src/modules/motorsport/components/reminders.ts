import { MessageFlags } from "discord.js";
import type { ComponentHandler } from "../../../core/types.ts";
import { groupEvents, withoutPinged } from "../channels/decisions.ts";
import { guildOf } from "../channels/lookup.ts";
import { setReminders, togglePings } from "../pings/actions.ts";
import { renderReminderPicker } from "../pings/render.ts";
import { MotorsportRepo } from "../repo.ts";
import { seriesInfo, toSeriesKey } from "../series.ts";
import type { EventSchedule, SeriesKey } from "../types.ts";

const pings: ComponentHandler = {
  id: "motorsport:pings",
  async handle(i, args, ctx) {
    await i.deferReply({ flags: MessageFlags.Ephemeral });
    const guild = await guildOf(ctx);
    const text = await togglePings(
      guild,
      new MotorsportRepo(ctx.db),
      i.user.id,
      toSeriesKey(args[0] ?? ""),
    );
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
    const series = toSeriesKey(args[0] ?? "");
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

    const series = toSeriesKey(args[0] ?? "");
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

export const reminderComponents: ComponentHandler[] = [pings, remindMenu, reminders];
