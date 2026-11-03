import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import { clip } from "../../../core/clip.ts";
import type { Slot } from "../types.ts";
import { answerId } from "./ids.ts";
import { slotLabel } from "./labels.ts";

const PLACEHOLDER_MAX = 100;

/** The answer prompt for one clue; input `word`, length fixed to the slot. */
export function clueModal(scope: string, stamp: string, slot: Slot, clue: string): ModalBuilder {
  const input = new TextInputBuilder()
    .setCustomId("word")
    .setLabel("Answer")
    .setStyle(TextInputStyle.Short)
    .setPlaceholder(clip(clue, PLACEHOLDER_MAX))
    .setMinLength(slot.cells.length)
    .setMaxLength(slot.cells.length)
    .setRequired(true);

  return new ModalBuilder()
    .setCustomId(answerId(scope, stamp, slot))
    .setTitle(slotLabel(slot))
    .addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(input));
}
