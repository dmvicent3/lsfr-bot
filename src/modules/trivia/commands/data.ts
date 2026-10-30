import { InteractionContextType, SlashCommandBuilder } from "discord.js";

const PERIOD_CHOICES = [
  { name: "Today", value: "today" },
  { name: "This week", value: "week" },
  { name: "This month", value: "month" },
  { name: "All time", value: "all" },
];

export const data = new SlashCommandBuilder()
  .setName("trivia")
  .setDescription("Channel trivia")
  .setContexts(InteractionContextType.Guild)
  .addSubcommand((sub) => sub.setName("start").setDescription("Start trivia in this channel"))
  .addSubcommand((sub) => sub.setName("stop").setDescription("Stop trivia in this channel"))
  .addSubcommand((sub) =>
    sub
      .setName("leaderboard")
      .setDescription("Points today, this week, this month or all time")
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
      .setName("stats")
      .setDescription("Points, wins and times")
      .addUserOption((o) => o.setName("member").setDescription("Whose stats (default: yours)")),
  )
  .addSubcommand((sub) =>
    sub
      .setName("report")
      .setDescription("Flag the last question asked here")
      .addStringOption((o) =>
        o.setName("reason").setDescription("What's wrong with it").setMaxLength(200),
      ),
  )
  .addSubcommand((sub) =>
    sub.setName("reports").setDescription("Questions players flagged (Manage Server)"),
  )
  .toJSON();
