import { InteractionContextType, SlashCommandBuilder } from "discord.js";
import { MODES } from "../multi/modes.ts";
import type { Mode } from "../multi/types.ts";
import { leaderboardSub, statsSub } from "./options.ts";

/** `/duo` or `/quad`: the board, a guess, its letter notes, stats and leaderboard. */
export function modeData(mode: Mode) {
  const { name, blurb, attempts } = MODES[mode];

  return new SlashCommandBuilder()
    .setName(mode)
    .setDescription(`${name}: ${blurb} at once in ${attempts} attempts`)
    .setContexts(InteractionContextType.Guild)
    .addSubcommand((sub) => sub.setName("play").setDescription(`Your boards for today's ${name}`))
    .addSubcommand((sub) =>
      sub
        .setName("guess")
        .setDescription(`Guess on every board of today's ${name}`)
        .addStringOption((o) => o.setName("word").setDescription("Your guess").setRequired(true)),
    )
    .addSubcommand((sub) =>
      sub.setName("letters").setDescription("Each board's placed, in-word and ruled-out letters"),
    )
    .addSubcommand(statsSub)
    .addSubcommand(leaderboardSub)
    .toJSON();
}
