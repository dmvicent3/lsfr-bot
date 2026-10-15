import {
  type AutocompleteInteraction,
  ButtonStyle,
  type ChatInputCommandInteraction,
  ComponentType,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";
import type { Ctx, SlashCommand } from "../../core/module.ts";
import { setSetting } from "../../core/settings.ts";
import { notFollowedText, togglePings, toggleReminder } from "./actions.ts";
import { log } from "../../core/log.ts";
import { createSeriesChannel } from "./channels.ts";
import { followErrorText } from "./errors.ts";
import { currentEvent } from "./decisions.ts";
import { formatLead, getLeadMinutes, LEAD_SETTING_KEY, parseLeadTime } from "./lead.ts";
import { renderSchedule } from "./render.ts";
import { MotorsportRepo } from "./repo.ts";
import { isSeriesKey, SERIES, seriesInfo } from "./series.ts";
import type { SeriesKey } from "./types.ts";

const seriesChoices = SERIES.map((s) => ({ name: s.name, value: s.key }));

const data = new SlashCommandBuilder()
  .setName("motorsport")
  .setDescription("Motorsport schedules and pings")
  .addSubcommand((sub) =>
    sub
      .setName("follow")
      .setDescription("Create a countdown channel and ping role for a series")
      .addStringOption((o) =>
        o
          .setName("series")
          .setDescription("Series")
          .setRequired(true)
          .addChoices(...seriesChoices),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName("unfollow")
      .setDescription("Delete a series' channel and ping role")
      .addStringOption((o) =>
        o
          .setName("series")
          .setDescription("Series")
          .setRequired(true)
          .addChoices(...seriesChoices),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName("pings")
      .setDescription("Turn season pings for a series on or off for yourself")
      .addStringOption((o) =>
        o
          .setName("series")
          .setDescription("Series")
          .setRequired(true)
          .addChoices(...seriesChoices),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName("remind")
      .setDescription("Get (or cancel) a one-off ping for a session of the next event")
      .addStringOption((o) =>
        o
          .setName("series")
          .setDescription("Series")
          .setRequired(true)
          .addChoices(...seriesChoices),
      )
      .addStringOption((o) =>
        o.setName("session").setDescription("Session").setRequired(true).setAutocomplete(true),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName("reminder-time")
      .setDescription("Show or set how long before a session pings go out")
      .addStringOption((o) =>
        o.setName("time").setDescription("e.g. 30m, 1h, 1h30m (5m to 24h)").setRequired(false),
      ),
  )
  .toJSON();

function seriesOption(i: ChatInputCommandInteraction): SeriesKey {
  const value = i.options.getString("series", true);
  if (!isSeriesKey(value)) throw new Error(`Unknown series ${value}`);
  return value;
}

async function reply(i: ChatInputCommandInteraction, content: string): Promise<void> {
  await i.reply({ content, flags: MessageFlags.Ephemeral });
}

/** Series with a follow in flight, so a double submit can't create two channels. */
const following = new Set<SeriesKey>();

async function follow(i: ChatInputCommandInteraction, ctx: Ctx): Promise<void> {
  const repo = new MotorsportRepo(ctx.db);
  const series = seriesOption(i);
  const info = seriesInfo(series);
  const existing = repo.getFollowed(series);
  if (existing) {
    await reply(i, `${info.name} is already followed in <#${existing.channelId}>.`);
    return;
  }
  if (following.has(series)) {
    await reply(i, `${info.name} is already being set up.`);
    return;
  }
  following.add(series);
  try {
    await i.deferReply({ flags: MessageFlags.Ephemeral });
    const guild = await ctx.client.guilds.fetch(ctx.config.guildId);
    const created = await createSeriesChannel(guild, info);
    try {
      const event = currentEvent(repo.listSessions(series), Date.now());
      const message = await created.channel.send(renderSchedule(info, event));
      await message.pin();
      repo.insertFollowed({
        series,
        channelId: created.channel.id,
        roleId: created.role.id,
        pinnedMessageId: message.id,
        pinnedEventId: event?.eventId ?? null,
        channelName: null,
        renamedAt: null,
      });
    } catch (err) {
      await Promise.allSettled([created.channel.delete(), created.role.delete()]);
      throw err;
    }
    await i.editReply(`Following ${info.name} in <#${created.channel.id}>.`);
  } catch (err) {
    log.error("motorsport:follow", `${series} failed`, err);
    await i.editReply(followErrorText(err));
  } finally {
    following.delete(series);
  }
}

async function unfollow(i: ChatInputCommandInteraction, ctx: Ctx): Promise<void> {
  const series = seriesOption(i);
  const followed = new MotorsportRepo(ctx.db).getFollowed(series);
  if (!followed) {
    await reply(i, notFollowedText(series));
    return;
  }
  const { name } = seriesInfo(series);
  await i.reply({
    content: `Unfollow ${name}? This deletes <#${followed.channelId}> and the @${name} role.`,
    flags: MessageFlags.Ephemeral,
    components: [
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.Button,
            custom_id: `motorsport:unfollow:${series}`,
            label: "Unfollow",
            style: ButtonStyle.Danger,
          },
        ],
      },
    ],
  });
}

async function remind(i: ChatInputCommandInteraction, ctx: Ctx): Promise<void> {
  const repo = new MotorsportRepo(ctx.db);
  const series = seriesOption(i);
  const now = Date.now();
  const event = currentEvent(repo.listSessions(series), now);
  const sessionId = i.options.getString("session", true);
  await reply(i, toggleReminder(repo, i.user.id, series, event?.eventId ?? null, sessionId, now));
}

async function reminderTime(i: ChatInputCommandInteraction, ctx: Ctx): Promise<void> {
  const input = i.options.getString("time");
  if (input === null) {
    await reply(i, `Reminders go out ${formatLead(getLeadMinutes(ctx.db))} before a session.`);
    return;
  }
  const minutes = parseLeadTime(input);
  if (minutes === null) {
    await reply(i, "Use a time like 30m, 1h or 1h30m (5m to 24h).");
    return;
  }
  setSetting(ctx.db, LEAD_SETTING_KEY, String(minutes));
  await reply(i, `Reminder time set to ${formatLead(minutes)}.`);
}

async function autocomplete(i: AutocompleteInteraction, ctx: Ctx): Promise<void> {
  const series = i.options.getString("series");
  if (series === null || !isSeriesKey(series)) {
    await i.respond([]);
    return;
  }
  const typed = i.options.getFocused().toLowerCase();
  const now = Date.now();
  const event = currentEvent(new MotorsportRepo(ctx.db).listSessions(series), now);
  const choices = (event?.sessions ?? [])
    .filter((s) => s.pingable && s.start.getTime() > now)
    .filter((s) => s.title.toLowerCase().includes(typed))
    .slice(0, 25)
    .map((s) => ({ name: `${event?.eventName ?? ""} — ${s.title}`, value: s.sessionId }));
  await i.respond(choices);
}

export const motorsportCommand: SlashCommand = {
  data,
  async execute(i, ctx) {
    switch (i.options.getSubcommand()) {
      case "follow":
        return follow(i, ctx);
      case "unfollow":
        return unfollow(i, ctx);
      case "pings": {
        const guild = await ctx.client.guilds.fetch(ctx.config.guildId);
        const text = await togglePings(
          guild,
          new MotorsportRepo(ctx.db),
          i.user.id,
          seriesOption(i),
        );
        return reply(i, text);
      }
      case "remind":
        return remind(i, ctx);
      case "reminder-time":
        return reminderTime(i, ctx);
      default:
        throw new Error(`Unknown subcommand ${i.options.getSubcommand()}`);
    }
  },
  autocomplete,
};
