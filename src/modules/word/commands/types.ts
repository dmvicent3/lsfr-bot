import type { Database } from "bun:sqlite";
import type { ChatInputCommandInteraction } from "discord.js";
import type { WordRepo } from "../store/repo.ts";

/** What every /word subcommand gets: the interaction (in a server), the tables and randomness. */
export interface CommandCtx {
  i: ChatInputCommandInteraction;
  guildId: string;
  db: Database;
  repo: WordRepo;
  random: () => number;
}

export type Handler = (c: CommandCtx) => Promise<void>;
