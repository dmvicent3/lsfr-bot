import type { Database } from "bun:sqlite";
import type { ChatInputCommandInteraction } from "discord.js";

/** What every /feedback subcommand gets: the interaction (in a server) and the database. */
export interface CommandCtx {
  i: ChatInputCommandInteraction;
  guildId: string;
  db: Database;
}

export type Handler = (c: CommandCtx) => Promise<void>;
