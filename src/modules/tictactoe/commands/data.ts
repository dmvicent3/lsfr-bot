import { InteractionContextType, SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("tictactoe")
  .setDescription("Play tic-tac-toe against jevos")
  .setContexts(InteractionContextType.Guild)
  .toJSON();
