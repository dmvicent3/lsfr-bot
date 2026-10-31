import type { ChatInputCommandInteraction } from "discord.js";
import type { Ctx } from "../../../core/types.ts";
import type { ShedRepo } from "../store/repo.ts";

/** What every /shed subcommand gets: the interaction (in a server), the bot, the tables, randomness. */
export interface CommandCtx {
  i: ChatInputCommandInteraction;
  guildId: string;
  ctx: Ctx;
  repo: ShedRepo;
  random: () => number;
}

export type Handler = (c: CommandCtx) => Promise<void>;
