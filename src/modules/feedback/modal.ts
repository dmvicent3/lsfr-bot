import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";

/** The feedback form: one paragraph `text`, 10–1000 characters, prefilled when editing. */
export function feedbackModal(customId: string, title: string, value?: string): ModalBuilder {
  const input = new TextInputBuilder()
    .setCustomId("text")
    .setLabel("Feedback")
    .setStyle(TextInputStyle.Paragraph)
    .setMinLength(10)
    .setMaxLength(1000)
    .setRequired(true);

  if (value) input.setValue(value);

  return new ModalBuilder()
    .setCustomId(customId)
    .setTitle(title)
    .addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(input));
}
