import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import type { Grid } from "../types.ts";
import { cellId, colLabel, rowLabel } from "./labels.ts";

const PLACEHOLDER_MAX = 100;

/** The answer prompt for one cell. */
export function answerModal(scope: string, cell: number, grid: Grid): ModalBuilder {
  const input = new TextInputBuilder()
    .setCustomId("country")
    .setLabel("Country")
    .setStyle(TextInputStyle.Short)
    .setPlaceholder(`${rowLabel(grid, cell)} · ${colLabel(grid, cell)}`.slice(0, PLACEHOLDER_MAX))
    .setMaxLength(60)
    .setRequired(true);

  return new ModalBuilder()
    .setCustomId(`grid:answer:${scope}:${cell}`)
    .setTitle(`Cell ${cellId(cell)}`)
    .addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(input));
}
