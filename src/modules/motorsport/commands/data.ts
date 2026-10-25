import { SlashCommandBuilder, type SlashCommandStringOption } from "discord.js";
import { resultSeries } from "../results/results.ts";
import { STANDINGS_SERIES } from "../standings/fetch.ts";
import { SERIES } from "../series.ts";
import type { SeriesKey } from "../types.ts";

const ALL: readonly SeriesKey[] = SERIES.map((s) => s.key);

/** The required series option, offering only `keys`. */
const seriesOption =
  (keys: readonly SeriesKey[]) =>
  (o: SlashCommandStringOption): SlashCommandStringOption =>
    o
      .setName("series")
      .setDescription("Series")
      .setRequired(true)
      .addChoices(
        ...SERIES.filter((s) => keys.includes(s.key)).map((s) => ({ name: s.name, value: s.key })),
      );

export const data = new SlashCommandBuilder()
  .setName("motorsport")
  .setDescription("Motorsport schedules and pings")
  .addSubcommand((sub) =>
    sub
      .setName("follow")
      .setDescription("Create a countdown channel and ping role for a series")
      .addStringOption(seriesOption(ALL)),
  )
  .addSubcommand((sub) =>
    sub
      .setName("unfollow")
      .setDescription("Delete a series' channel and ping role")
      .addStringOption(seriesOption(ALL)),
  )
  .addSubcommand((sub) =>
    sub
      .setName("pings")
      .setDescription("Turn season pings for a series on or off for yourself")
      .addStringOption(seriesOption(ALL)),
  )
  .addSubcommand((sub) =>
    sub
      .setName("remind")
      .setDescription("Get (or cancel) a one-off ping for a session of the next event")
      .addStringOption(seriesOption(ALL))
      .addStringOption((o) =>
        o.setName("session").setDescription("Session").setRequired(true).setAutocomplete(true),
      ),
  )
  .addSubcommand((sub) => sub.setName("next").setDescription("Next session of every series"))
  .addSubcommand((sub) =>
    sub
      .setName("results")
      .setDescription("Latest qualifying, sprint or race results")
      .addStringOption(seriesOption(resultSeries())),
  )
  .addSubcommand((sub) =>
    sub
      .setName("standings")
      .setDescription("Current championship standings")
      .addStringOption(seriesOption(STANDINGS_SERIES))
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
      .addStringOption(seriesOption(resultSeries())),
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
