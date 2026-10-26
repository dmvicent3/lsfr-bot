import type { ReminderStore } from "../store/reminders.ts";
import type { ChatInputCommandInteraction } from "discord.js";

/** What every /remind subcommand gets: the interaction, the server and the reminders table. */
export interface CommandCtx {
  i: ChatInputCommandInteraction;
  guildId: string;
  store: ReminderStore;
}

export type Handler = (c: CommandCtx) => Promise<void>;
