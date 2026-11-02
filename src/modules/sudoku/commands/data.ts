import { InteractionContextType, SlashCommandBuilder } from "discord.js";

export const PERIOD_CHOICES = [
  { name: "Today", value: "today" },
  { name: "This week", value: "week" },
  { name: "This month", value: "month" },
  { name: "All time", value: "all" },
];

export const LEVEL_CHOICES = [
  { name: "Easy", value: "easy" },
  { name: "Medium", value: "medium" },
  { name: "Hard", value: "hard" },
];

export const data = new SlashCommandBuilder()
  .setName("sudoku")
  .setDescription("Daily sudoku")
  .setContexts(InteractionContextType.Guild)
  .addSubcommand((sub) =>
    sub
      .setName("daily")
      .setDescription("Today's puzzle, the same for everyone in the server")
      .addStringOption((o) =>
        o
          .setName("difficulty")
          .setDescription("How hard")
          .setRequired(true)
          .addChoices(...LEVEL_CHOICES),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName("practice")
      .setDescription("A fresh puzzle just for you, no points")
      .addStringOption((o) =>
        o
          .setName("difficulty")
          .setDescription("How hard")
          .setRequired(true)
          .addChoices(...LEVEL_CHOICES),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName("stats")
      .setDescription("Points, solves, times and streaks")
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
      .setDescription("Time zone (Manage Server)")
      .addStringOption((o) =>
        o
          .setName("timezone")
          .setDescription("IANA time zone, e.g. Europe/Lisbon")
          .setRequired(true),
      ),
  )
  .toJSON();
