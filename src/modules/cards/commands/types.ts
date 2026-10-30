import type { ChatInputCommandInteraction } from "discord.js";
import type { Ctx } from "../../../core/types.ts";
import type { CardsRepo } from "../store/repo.ts";

/** What every /cards subcommand gets: the interaction (in a server), the bot, the tables, randomness. */
export interface CommandCtx {
  i: ChatInputCommandInteraction;
  guildId: string;
  ctx: Ctx;
  repo: CardsRepo;
  random: () => number;
}

export type Handler = (c: CommandCtx) => Promise<void>;
