import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import { clip } from "../../../core/clip.ts";
import { EMPTY_CELL, slotText } from "../play/cells.ts";
import { slotsThrough } from "../play/through.ts";
import { cellWordId, slotKey } from "./ids.ts";
import { slotLabel } from "./labels.ts";
import type { BoardView } from "./types.ts";

const PLACEHOLDER_MAX = 100;

type Board = Pick<BoardView, "scope" | "stamp" | "stored" | "cells">;

/** One slot's input: its letters prefilled (`.` for blanks) unless it is all empty; optional. */
function slotInput(v: Board, at: number): ActionRowBuilder<TextInputBuilder> {
  const slot = v.stored.puzzle.slots[at]!;
  const value = slotText(v.cells, slot);
  const input = new TextInputBuilder()
    .setCustomId(slotKey(slot))
    .setLabel(slotLabel(slot))
    .setStyle(TextInputStyle.Short)
    .setPlaceholder(clip(v.stored.clues[at]!, PLACEHOLDER_MAX))
    .setRequired(false)
    .setMinLength(0)
    .setMaxLength(slot.cells.length);

  if (value !== EMPTY_CELL.repeat(slot.cells.length)) input.setValue(value);

  return new ActionRowBuilder<TextInputBuilder>().addComponents(input);
}

/** The words through one square, across first, titled `Row R, column C`. */
export function cellModal(v: Board, cell: number): ModalBuilder {
  const { size } = v.stored.puzzle;
  const title = `Row ${Math.floor(cell / size) + 1}, column ${(cell % size) + 1}`;

  return new ModalBuilder()
    .setCustomId(cellWordId(v.scope, v.stamp, cell))
    .setTitle(title)
    .addComponents(slotsThrough(v.stored.puzzle, cell).map((at) => slotInput(v, at)));
}
