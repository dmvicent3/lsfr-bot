import type { CommandCtx, Handler } from "./types.ts";
import { type AutocompleteInteraction, MessageFlags } from "discord.js";
import { setSetting } from "../../../core/settings.ts";
import type { Ctx } from "../../../core/types.ts";
import { currentEvent, sessionKey } from "../channels/decisions.ts";
import { guildOf } from "../channels/lookup.ts";
import { togglePings, toggleReminder } from "../pings/actions.ts";
import { formatLead, getLeadMinutes, LEAD_SETTING_KEY, parseLeadTime } from "../pings/lead.ts";
import { MotorsportRepo } from "../repo.ts";
import { isSeriesKey } from "../series.ts";
import { reply, seriesOption } from "./kit.ts";

const MAX_CHOICES = 25;

async function pings({ i, ctx, repo }: CommandCtx): Promise<void> {
  await i.deferReply({ flags: MessageFlags.Ephemeral });
  const guild = await guildOf(ctx);
  await i.editReply(await togglePings(guild, repo, i.user.id, seriesOption(i)));
}

async function remind({ i, repo }: CommandCtx): Promise<void> {
  const series = seriesOption(i);
  const now = Date.now();
  const event = currentEvent(repo.sessions.list(series), now);
  const sessionId = i.options.getString("session", true);
  const viewer = { userId: i.user.id, now };
  await reply(
    i,
    toggleReminder(repo, viewer, { series, eventId: event?.eventId ?? null, sessionId }),
  );
}

async function reminderTime({ i, ctx }: CommandCtx): Promise<void> {
  const input = i.options.getString("time");
  if (input === null) {
    return reply(i, `Reminders go out ${formatLead(getLeadMinutes(ctx.db))} before a session.`);
  }
  const minutes = parseLeadTime(input);
  if (minutes === null) return reply(i, "Use a time like 30m, 1h or 1h30m (5m to 24h).");
  setSetting(ctx.db, LEAD_SETTING_KEY, String(minutes));
  await reply(i, `Reminder time set to ${formatLead(minutes)}.`);
}

/** `remind`'s session: the current event's upcoming pinged sessions not yet pinged. */
export async function autocomplete(i: AutocompleteInteraction, ctx: Ctx): Promise<void> {
  const series = i.options.getString("series");
  if (series === null || !isSeriesKey(series)) return i.respond([]);
  const typed = i.options.getFocused().toLowerCase();
  const now = Date.now();
  const repo = new MotorsportRepo(ctx.db);
  const event = currentEvent(repo.sessions.list(series), now);
  const sent = repo.pings.sentKeys(series);
  const choices = (event?.sessions ?? [])
    .filter((s) => s.pingable && s.start.getTime() > now && !sent.has(sessionKey(s)))
    .filter((s) => s.title.toLowerCase().includes(typed))
    .slice(0, MAX_CHOICES)
    .map((s) => ({ name: `${event?.eventName ?? ""} — ${s.title}`, value: s.sessionId }));
  await i.respond(choices);
}

export const reminderHandlers: Record<string, Handler> = {
  pings,
  remind,
  "reminder-time": reminderTime,
};
