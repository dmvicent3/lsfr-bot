import type { Database } from "bun:sqlite";
import type { ChatInputCommandInteraction } from "discord.js";
import type { Ask } from "../play/make.ts";
import type { CrosswordRepo } from "../store/repo.ts";

/** What every /crossword subcommand gets: the interaction (in a server), the tables and the clue writer. */
export interface CommandCtx {
  i: ChatInputCommandInteraction;
  guildId: string;
  db: Database;
  repo: CrosswordRepo;
  ask: Ask | null;
  random: () => number;
}

export type Handler = (c: CommandCtx) => Promise<void>;
