import {
  InteractionContextType,
  SlashCommandBuilder,
  type SlashCommandIntegerOption,
  type SlashCommandSubcommandBuilder,
} from "discord.js";
import { MAX_SIDE, MIN_SIDE } from "../setup.ts";

const DIFFICULTY_CHOICES = [
  { name: "Beginner 9×9 · 10", value: "beginner" },
  { name: "Intermediate 16×16 · 40", value: "intermediate" },
  { name: "Expert 20×20 · 80", value: "expert" },
];

const CONTROLS_CHOICES = [
  { name: "Column and row menus", value: "menus" },
  { name: "Arrow buttons", value: "arrows" },
  { name: "Menus and arrows", value: "both" },
];

const side = (o: SlashCommandIntegerOption, name: string, description: string) =>
  o.setName(name).setDescription(description).setMinValue(MIN_SIDE).setMaxValue(MAX_SIDE);

const play = (sub: SlashCommandSubcommandBuilder) =>
  sub
    .setName("play")
    .setDescription("Start a board")
    .addStringOption((o) =>
      o
        .setName("difficulty")
        .setDescription("Default: beginner")
        .addChoices(...DIFFICULTY_CHOICES),
    )
    .addIntegerOption((o) => side(o, "width", "Columns, 5 to 20"))
    .addIntegerOption((o) => side(o, "height", "Rows, 5 to 20"))
    .addIntegerOption((o) => o.setName("mines").setDescription("Number of mines").setMinValue(1))
    .addStringOption((o) =>
      o
        .setName("controls")
        .setDescription("How to move the cursor (default: menus)")
        .addChoices(...CONTROLS_CHOICES),
    );

export const data = new SlashCommandBuilder()
  .setName("minesweeper")
  .setDescription("Play Minesweeper")
  .setContexts(InteractionContextType.Guild)
  .addSubcommand(play)
  .addSubcommand((sub) =>
    sub
      .setName("stats")
      .setDescription("Wins and best times")
      .addUserOption((o) => o.setName("member").setDescription("Whose stats (default: yours)")),
  )
  .toJSON();
