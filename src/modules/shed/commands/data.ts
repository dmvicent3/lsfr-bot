import { InteractionContextType, SlashCommandBuilder } from "discord.js";

const PERIOD_CHOICES = [
  { name: "Today", value: "today" },
  { name: "This week", value: "week" },
  { name: "This month", value: "month" },
  { name: "All time", value: "all" },
];

export const data = new SlashCommandBuilder()
  .setName("shed")
  .setDescription("Shed: match colours and values, empty your hand first")
  .setContexts(InteractionContextType.Guild)
  .addSubcommand((sub) =>
    sub
      .setName("new")
      .setDescription("Open a lobby in this channel")
      .addBooleanOption((o) =>
        o.setName("stacking").setDescription("Stack duplicates and answer draws (default: on)"),
      ),
  )
  .addSubcommand((sub) => sub.setName("stop").setDescription("Stop the game in this channel"))
  .addSubcommand((sub) =>
    sub
      .setName("leaderboard")
      .setDescription("Points today, this week, this month or all time")
      .addStringOption((o) =>
        o
          .setName("period")
          .setDescription("Default: this week")
          .addChoices(...PERIOD_CHOICES),
      )
      .addIntegerOption((o) => o.setName("page").setDescription("Page").setMinValue(1)),
  )
  .addSubcommand((sub) =>
    sub
      .setName("stats")
      .setDescription("Games, wins, average place and points")
      .addUserOption((o) => o.setName("member").setDescription("Whose stats (default: yours)")),
  )
  .toJSON();
