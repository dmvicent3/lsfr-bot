import type { ChatInputCommandInteraction } from "discord.js";
import type { Ctx } from "../../../core/types.ts";
import type { TriviaRepo } from "../store/repo.ts";

/** What every /trivia subcommand gets: the interaction (in a server), the bot, the tables, randomness. */
export interface CommandCtx {
  i: ChatInputCommandInteraction;
  guildId: string;
  ctx: Ctx;
  repo: TriviaRepo;
  random: () => number;
}

export type Handler = (c: CommandCtx) => Promise<void>;
