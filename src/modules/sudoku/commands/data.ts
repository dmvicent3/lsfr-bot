import { InteractionContextType, SlashCommandBuilder } from "discord.js";
import { PERIOD_CHOICES } from "../../../core/periods.ts";
import { BASE } from "../scoring.ts";
import type { Level } from "../types.ts";

export const LEVEL_CHOICES: { name: string; value: Level }[] = [
  { name: "Easy", value: "easy" },
  { name: "Medium", value: "medium" },
  { name: "Hard", value: "hard" },
];

/** The daily's choices show what each level pays (scoring.ts BASE). */
const DAILY_CHOICES = LEVEL_CHOICES.map((c) => ({
  ...c,
  name: `${c.name} (${BASE[c.value]} pts)`,
}));

export const data = new SlashCommandBuilder()
  .setName("sudoku")
  .setDescription("Daily sudoku")
  .setContexts(InteractionContextType.Guild)
  .addSubcommand((sub) =>
    sub
      .setName("daily")
      .setDescription("Today's puzzle, the same for everyone; one a day, harder pays more")
      .addStringOption((o) =>
        o
          .setName("difficulty")
          .setDescription("Your pick for today (default medium); locked once you open it")
          .addChoices(...DAILY_CHOICES),
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
          .setMaxLength(64)
          .setRequired(true),
      ),
  )
  .toJSON();
