import {
  type AutocompleteInteraction,
  ButtonStyle,
  type ChatInputCommandInteraction,
  ComponentType,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";
import type { Ctx, SlashCommand } from "../../core/types.ts";
import { setSetting } from "../../core/settings.ts";
import { notFollowedText, togglePings, toggleReminder } from "./pings/actions.ts";
import { log } from "../../core/log.ts";
import { createSeriesChannel } from "./channels/channels.ts";
import { latestResult } from "./results/collect-results.ts";
import { followErrorText } from "./errors.ts";
import { currentEvent, sessionKey } from "./channels/decisions.ts";
import { formatLead, getLeadMinutes, LEAD_SETTING_KEY, parseLeadTime } from "./pings/lead.ts";
import { renderNext } from "./schedule/next.ts";
import { seasonLeaderboard } from "./predictions/predict-actions.ts";
import { renderSchedule } from "./channels/render.ts";
import { renderResults, resultSeries } from "./results/results.ts";
import { fetchStandings, renderStandings, STANDINGS_SERIES } from "./standings/standings.ts";
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
  .addSubcommand((sub) => sub.setName("next").setDescription("Next session of every series"))
  .addSubcommand((sub) =>
    sub
      .setName("results")
      .setDescription("Latest qualifying, sprint or race results")
      .addStringOption((o) =>
        o
          .setName("series")
          .setDescription("Series")
          .setRequired(true)
          .addChoices(...seriesChoices.filter((c) => resultSeries().includes(c.value))),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName("standings")
      .setDescription("Current championship standings")
      .addStringOption((o) =>
        o
          .setName("series")
          .setDescription("Series")
          .setRequired(true)
          .addChoices(...seriesChoices.filter((c) => STANDINGS_SERIES.includes(c.value))),
      )
      .addStringOption((o) =>
        o
          .setName("championship")
          .setDescription("Drivers (default) or constructors (F1 only)")
          .addChoices(
            { name: "Drivers", value: "drivers" },
            { name: "Constructors", value: "constructors" },
          ),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName("leaderboard")
      .setDescription("Podium prediction standings this season")
      .addStringOption((o) =>
        o
          .setName("series")
          .setDescription("Series")
          .setRequired(true)
          .addChoices(...seriesChoices.filter((c) => resultSeries().includes(c.value))),
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
      const message = await created.channel.send(
        renderSchedule(info, event, repo.weatherFor(series)),
      );
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

async function next(i: ChatInputCommandInteraction, ctx: Ctx): Promise<void> {
  const repo = new MotorsportRepo(ctx.db);
  const sessions = new Map(SERIES.map((s) => [s.key, repo.listSessions(s.key)] as const));
  const followed = new Map(repo.listFollowed().map((f) => [f.series, f.channelId] as const));
  await i.reply({
    embeds: [renderNext(sessions, followed, Date.now())],
    flags: MessageFlags.Ephemeral,
  });
}

async function results(i: ChatInputCommandInteraction, ctx: Ctx): Promise<void> {
  const series = seriesOption(i);
  const info = seriesInfo(series);
  await i.deferReply({ flags: MessageFlags.Ephemeral });
  const latest = await latestResult(new MotorsportRepo(ctx.db), series, Date.now(), fetch);
  await i.editReply(
    latest
      ? renderResults(
          info,
          latest.eventName,
          latest.kind,
          { rows: latest.rows },
          { spoiler: false },
        )
      : `No ${info.name} results yet.`,
  );
}

async function standings(i: ChatInputCommandInteraction): Promise<void> {
  const series = seriesOption(i);
  const info = seriesInfo(series);
  const champ = i.options.getString("championship") === "constructors" ? "constructors" : "drivers";
  await i.deferReply({ flags: MessageFlags.Ephemeral });
  try {
    const table = await fetchStandings(series, champ, new Date());
    const missing =
      champ === "constructors" && series !== "f1"
        ? "Constructors' standings are only available for F1."
        : `No ${info.name} standings available right now.`;
    await i.editReply(table ? renderStandings(info, champ, table) : missing);
  } catch (err) {
    log.error("motorsport:standings", `${series} ${champ} failed`, err);
    await i.editReply("⚠️ Couldn't load the standings right now.");
  }
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
  const repo = new MotorsportRepo(ctx.db);
  const event = currentEvent(repo.listSessions(series), now);
  const sent = repo.sentKeys(series);
  const choices = (event?.sessions ?? [])
    .filter((s) => s.pingable && s.start.getTime() > now && !sent.has(sessionKey(s)))
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
        await i.deferReply({ flags: MessageFlags.Ephemeral });
        const guild = await ctx.client.guilds.fetch(ctx.config.guildId);
        const text = await togglePings(
          guild,
          new MotorsportRepo(ctx.db),
          i.user.id,
          seriesOption(i),
        );
        await i.editReply(text);
        return;
      }
      case "remind":
        return remind(i, ctx);
      case "reminder-time":
        return reminderTime(i, ctx);
      case "next":
        return next(i, ctx);
      case "results":
        return results(i, ctx);
      case "standings":
        return standings(i);
      case "leaderboard":
        // Public, so the table can be argued over; mentions show names without pinging.
        await i.reply({
          content: seasonLeaderboard(new MotorsportRepo(ctx.db), seriesOption(i), Date.now()),
          allowedMentions: { parse: [] },
        });
        return;
      default:
        throw new Error(`Unknown subcommand ${i.options.getSubcommand()}`);
    }
  },
  autocomplete,
};
