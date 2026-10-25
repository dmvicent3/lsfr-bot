import type { ChatInputCommandInteraction } from "discord.js";
import type { Ctx } from "../../../core/types.ts";
import type { MotorsportRepo } from "../repo.ts";

/** What every /motorsport subcommand gets: the interaction, the bot and the motorsport tables. */
export interface CommandCtx {
  i: ChatInputCommandInteraction;
  ctx: Ctx;
  repo: MotorsportRepo;
}

export type Handler = (c: CommandCtx) => Promise<void>;
