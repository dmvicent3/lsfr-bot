import type { SlashCommandSubcommandBuilder } from "discord.js";
import { PERIOD_CHOICES } from "../../../core/periods.ts";

/** `stats [user]`, the same in /word, /duo and /quad. */
export const statsSub = (sub: SlashCommandSubcommandBuilder): SlashCommandSubcommandBuilder =>
  sub
    .setName("stats")
    .setDescription("Points, wins and streaks")
    .addUserOption((o) => o.setName("user").setDescription("Whose stats (default: yours)"));

/** `leaderboard [period] [page]`, the same in /word, /duo and /quad. */
export const leaderboardSub = (sub: SlashCommandSubcommandBuilder): SlashCommandSubcommandBuilder =>
  sub
    .setName("leaderboard")
    .setDescription("Rankings for today, the week, the month or all time")
    .addStringOption((o) =>
      o
        .setName("period")
        .setDescription("Default: today")
        .addChoices(...PERIOD_CHOICES),
    )
    .addIntegerOption((o) => o.setName("page").setDescription("Page").setMinValue(1));
