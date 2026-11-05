import type { Database } from "bun:sqlite";
import type { ChatInputCommandInteraction } from "discord.js";
import type { GroupsRepo } from "../store/repo.ts";

/** What every /groups subcommand gets: the interaction (in a server), the tables, the random. */
export interface CommandCtx {
  i: ChatInputCommandInteraction;
  guildId: string;
  db: Database;
  repo: GroupsRepo;
  random: () => number;
}

export type Handler = (c: CommandCtx) => Promise<void>;
