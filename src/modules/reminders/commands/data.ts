import { InteractionContextType, SlashCommandBuilder } from "discord.js";
import { MAX_TEXT } from "../rules.ts";

export const data = new SlashCommandBuilder()
  .setName("remind")
  .setDescription("Reminders, pinged in this channel when they're due")
  .setContexts(InteractionContextType.Guild)
  .addSubcommand((sub) =>
    sub
      .setName("set")
      .setDescription("Set a reminder")
      .addStringOption((o) =>
        o
          .setName("when")
          .setDescription(
            "30m, 2h, 18:00, tomorrow 9:00, mon 9:00 or 2026-11-02 14:30 (Lisbon time)",
          )
          .setRequired(true)
          .setMaxLength(40),
      )
      .addStringOption((o) =>
        o
          .setName("what")
          .setDescription("What to remind about")
          .setRequired(true)
          .setMaxLength(MAX_TEXT),
      )
      .addMentionableOption((o) => o.setName("who").setDescription("Who to ping (default: you)")),
  )
  .addSubcommand((sub) =>
    sub.setName("list").setDescription("Your reminders here, with cancel buttons"),
  )
  .toJSON();
