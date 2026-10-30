import { InteractionContextType, SlashCommandBuilder } from "discord.js";

const LEVEL_CHOICES = [
  { name: "Easy", value: "easy" },
  { name: "Normal", value: "normal" },
  { name: "Hard", value: "hard" },
];

const PERIOD_CHOICES = [
  { name: "Today", value: "today" },
  { name: "This week", value: "week" },
  { name: "This month", value: "month" },
  { name: "All time", value: "all" },
];

export const data = new SlashCommandBuilder()
  .setName("four")
  .setDescription("Four in a row against jevos")
  .setContexts(InteractionContextType.Guild)
  .addSubcommand((sub) =>
    sub
      .setName("play")
      .setDescription("Start a game (gives up your current one)")
      .addStringOption((o) =>
        o
          .setName("difficulty")
          .setDescription("Default: normal")
          .addChoices(...LEVEL_CHOICES),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName("stats")
      .setDescription("Wins, losses, draws and best win per difficulty")
      .addUserOption((o) => o.setName("member").setDescription("Default: you")),
  )
  .addSubcommand((sub) =>
    sub
      .setName("leaderboard")
      .setDescription("Points for wins: hard 3, normal 2, easy 1")
      .addStringOption((o) =>
        o
          .setName("period")
          .setDescription("Default: this week")
          .addChoices(...PERIOD_CHOICES),
      )
      .addIntegerOption((o) => o.setName("page").setDescription("Page").setMinValue(1)),
  )
  .toJSON();
