import { InteractionContextType, SlashCommandBuilder } from "discord.js";
import { MAX_SIDE, MIN_SIDE } from "../setup.ts";

const DIFFICULTY_CHOICES = [
  { name: "Beginner 9×9 · 10", value: "beginner" },
  { name: "Intermediate 16×16 · 40", value: "intermediate" },
  { name: "Expert 20×20 · 80", value: "expert" },
];

export const data = new SlashCommandBuilder()
  .setName("minesweeper")
  .setDescription("Play Minesweeper")
  .setContexts(InteractionContextType.Guild)
  .addSubcommand((sub) =>
    sub
      .setName("play")
      .setDescription("Start a board")
      .addStringOption((o) =>
        o
          .setName("difficulty")
          .setDescription("Default: beginner")
          .addChoices(...DIFFICULTY_CHOICES),
      )
      .addIntegerOption((o) =>
        o
          .setName("width")
          .setDescription("Columns, 5 to 20")
          .setMinValue(MIN_SIDE)
          .setMaxValue(MAX_SIDE),
      )
      .addIntegerOption((o) =>
        o
          .setName("height")
          .setDescription("Rows, 5 to 20")
          .setMinValue(MIN_SIDE)
          .setMaxValue(MAX_SIDE),
      )
      .addIntegerOption((o) => o.setName("mines").setDescription("Number of mines").setMinValue(1)),
  )
  .addSubcommand((sub) =>
    sub
      .setName("stats")
      .setDescription("Wins and best times")
      .addUserOption((o) => o.setName("member").setDescription("Whose stats (default: yours)")),
  )
  .toJSON();
