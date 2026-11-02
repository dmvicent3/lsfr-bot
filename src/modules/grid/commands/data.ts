import { InteractionContextType, SlashCommandBuilder } from "discord.js";
import { PERIOD_CHOICES } from "../../../core/periods.ts";

export const data = new SlashCommandBuilder()
  .setName("grid")
  .setDescription("Daily country grid")
  .setContexts(InteractionContextType.Guild)
  .addSubcommand((sub) =>
    sub
      .setName("play")
      .setDescription("Today's 3×3 country grid, the same for everyone in the server"),
  )
  .addSubcommand((sub) => sub.setName("practice").setDescription("A practice grid, just for you"))
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
