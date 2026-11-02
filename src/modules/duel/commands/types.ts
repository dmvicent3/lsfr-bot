import type { Database } from "bun:sqlite";
import type { ChatInputCommandInteraction } from "discord.js";
import type { DuelRepo } from "../store/repo.ts";
import type { Snapshot } from "../types.ts";

/** What every /duel subcommand gets: the interaction (in a server), the tables and the country data. */
export interface CommandCtx {
  i: ChatInputCommandInteraction;
  guildId: string;
  db: Database;
  repo: DuelRepo;
  snapshotSource: () => Snapshot | null;
}

export type Handler = (c: CommandCtx) => Promise<void>;
