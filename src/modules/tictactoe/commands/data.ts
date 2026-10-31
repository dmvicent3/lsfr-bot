import { InteractionContextType, SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("tictactoe")
  .setDescription("Play tic-tac-toe against jevos")
  .setContexts(InteractionContextType.Guild)
  .addStringOption((o) =>
    o
      .setName("difficulty")
      .setDescription("Default: normal")
      .addChoices(
        { name: "Easy", value: "easy" },
        { name: "Normal", value: "normal" },
        { name: "Hard", value: "hard" },
      ),
  )
  .toJSON();
