import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import { puzzleNumber } from "../../../core/daily.ts";
import { FIRST_MULTI_PUZZLE } from "../puzzle-date.ts";
import { GUESS_FIELD, answerId } from "./ids.ts";
import { MODES } from "./modes.ts";
import type { MultiPuzzle } from "./types.ts";

/** The guess prompt: one word of the puzzle's length. */
export function guessModal(p: MultiPuzzle): ModalBuilder {
  const input = new TextInputBuilder()
    .setCustomId(GUESS_FIELD)
    .setLabel(`Your guess (${p.length} letters)`)
    .setStyle(TextInputStyle.Short)
    .setMinLength(p.length)
    .setMaxLength(p.length)
    .setRequired(true);

  return new ModalBuilder()
    .setCustomId(answerId(p.mode, p.date))
    .setTitle(`${MODES[p.mode].name} #${puzzleNumber(p.date, FIRST_MULTI_PUZZLE)}`)
    .addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(input));
}
