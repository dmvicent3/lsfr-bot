import { InteractionContextType, SlashCommandBuilder } from "discord.js";
import { PERIOD_CHOICES } from "../../../core/periods.ts";

export const data = new SlashCommandBuilder()
  .setName("crossword")
  .setDescription("Daily mini crossword")
  .setContexts(InteractionContextType.Guild)
  .addSubcommand((sub) =>
    sub
      .setName("play")
      .setDescription("Today's 5×5 mini crossword, the same for everyone in the server"),
  )
  .addSubcommand((sub) =>
    sub
      .setName("practice")
      .setDescription("A practice crossword, just for you")
      .addIntegerOption((o) =>
        o
          .setName("size")
          .setDescription("Grid size (default: 5)")
          .addChoices(
            { name: "5×5", value: 5 },
            { name: "7×7", value: 7 },
            { name: "15×15", value: 15 },
          ),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName("stats")
      .setDescription("Points, days played and streaks")
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
          .setMaxLength(64)
          .setRequired(true),
      ),
  )
  .toJSON();
