import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import { clip } from "../../../core/clip.ts";
import { answerId } from "./ids.ts";
import { slotLabel } from "./labels.ts";
import type { ClueModal } from "./types.ts";

const PLACEHOLDER_MAX = 100;

/** The answer prompt for one clue; input `word`, length fixed to the slot, prefilled when given. */
export function clueModal(m: ClueModal): ModalBuilder {
  const input = new TextInputBuilder()
    .setCustomId("word")
    .setLabel("Answer")
    .setStyle(TextInputStyle.Short)
    .setPlaceholder(clip(m.clue, PLACEHOLDER_MAX))
    .setMinLength(m.slot.cells.length)
    .setMaxLength(m.slot.cells.length)
    .setRequired(true);

  if (m.value) input.setValue(m.value);

  return new ModalBuilder()
    .setCustomId(answerId(m.scope, m.stamp, m.slot))
    .setTitle(slotLabel(m.slot))
    .addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(input));
}
