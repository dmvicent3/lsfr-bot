import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import { MAX_GUESS, MIN_GUESS } from "../play/validate.ts";
import { GUESS_FIELD, answerId } from "./ids.ts";

/** The guess prompt: one word of 2–10 letters; `title` names the round. */
export function guessModal(m: { scope: string; stamp: string; title: string }): ModalBuilder {
  const input = new TextInputBuilder()
    .setCustomId(GUESS_FIELD)
    .setLabel("Your guess")
    .setStyle(TextInputStyle.Short)
    .setPlaceholder(`Any word of ${MIN_GUESS}–${MAX_GUESS} letters`)
    .setMinLength(MIN_GUESS)
    .setMaxLength(MAX_GUESS)
    .setRequired(true);

  return new ModalBuilder()
    .setCustomId(answerId(m.scope, m.stamp))
    .setTitle(m.title)
    .addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(input));
}
