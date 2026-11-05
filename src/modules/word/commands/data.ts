import { InteractionContextType, SlashCommandBuilder } from "discord.js";
import { PERIOD_CHOICES } from "../../../core/periods.ts";

const MODE_CHOICES = [
  { name: "Classic", value: "classic" },
  { name: "Duo", value: "duo" },
  { name: "Quad", value: "quad" },
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
    sub.setName("letters").setDescription("Which letters are placed, in the word or ruled out"),
  )
  .addSubcommand((sub) =>
    sub
      .setName("stats")
      .setDescription("Points, wins and streaks")
      .addUserOption((o) => o.setName("user").setDescription("Whose stats (default: yours)"))
      .addStringOption((o) =>
        o
          .setName("mode")
          .setDescription("Default: classic")
          .addChoices(...MODE_CHOICES),
      ),
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
      .addIntegerOption((o) => o.setName("page").setDescription("Page").setMinValue(1))
      .addStringOption((o) =>
        o
          .setName("mode")
          .setDescription("Default: classic")
          .addChoices(...MODE_CHOICES),
      ),
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
