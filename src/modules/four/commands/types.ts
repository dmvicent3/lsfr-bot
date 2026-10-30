import type { ChatInputCommandInteraction } from "discord.js";
import type { Jev } from "../../../core/jev/types.ts";
import type { Ctx } from "../../../core/types.ts";
import type { FourRepo } from "../store/repo.ts";

/** What the command and buttons need beyond the interaction. */
export interface PlayDeps {
  jev: Jev;
  random: () => number;
}

/** What every /four subcommand gets: the interaction (in a server), the bot, the tables, deps. */
export interface CommandCtx {
  i: ChatInputCommandInteraction;
  guildId: string;
  ctx: Ctx;
  repo: FourRepo;
  d: PlayDeps;
}

export type Handler = (c: CommandCtx) => Promise<void>;
