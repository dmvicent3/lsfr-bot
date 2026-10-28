import { InteractionContextType, SlashCommandBuilder } from "discord.js";

export const PERIOD_CHOICES = [
  { name: "Today", value: "today" },
  { name: "This week", value: "week" },
  { name: "This month", value: "month" },
  { name: "All time", value: "all" },
];

export const data = new SlashCommandBuilder()
  .setName("word")
  .setDescription("Daily word game")
  .setContexts(InteractionContextType.Guild)
  .addSubcommand((sub) => sub.setName("play").setDescription("Your board for today's word"))
  .addSubcommand((sub) =>
    sub
      .setName("guess")
      .setDescription("Guess today's word")
      .addStringOption((o) => o.setName("word").setDescription("Your guess").setRequired(true)),
  )
  .addSubcommand((sub) =>
    sub
      .setName("stats")
      .setDescription("Points, wins and streaks")
      .addUserOption((o) => o.setName("user").setDescription("Whose stats (default: yours)")),
  )
  .addSubcommand((sub) =>
    sub
      .setName("leaderboard")
      .setDescription("Rankings for today, the week, the month or all time")
      .addStringOption((o) =>
        o
          .setName("period")
          .setDescription("Default: today")
          .addChoices(...PERIOD_CHOICES),
      )
      .addIntegerOption((o) => o.setName("page").setDescription("Page").setMinValue(1)),
  )
  .addSubcommand((sub) =>
    sub
      .setName("settings")
      .setDescription("Word length and time zone (Manage Server)")
      .addIntegerOption((o) =>
        o.setName("length").setDescription("Letters, 4 to 7").setMinValue(4).setMaxValue(7),
      )
      .addStringOption((o) =>
        o.setName("timezone").setDescription("IANA time zone, e.g. Europe/Lisbon"),
      ),
  )
  .toJSON();
