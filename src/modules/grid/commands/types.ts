import type { Database } from "bun:sqlite";
import type { ChatInputCommandInteraction } from "discord.js";
import type { Snapshot } from "../../../core/countries/types.ts";
import type { GridRepo } from "../store/repo.ts";

/** What every /grid subcommand gets: the interaction (in a server), the tables and the country data. */
export interface CommandCtx {
  i: ChatInputCommandInteraction;
  guildId: string;
  db: Database;
  repo: GridRepo;
  snapshotSource: () => Snapshot | null;
  random: () => number;
}

export type Handler = (c: CommandCtx) => Promise<void>;
