import type { ChatInputCommandInteraction } from "discord.js";
import type { Ctx } from "../../../core/types.ts";
import type { GameStore } from "../store/games.ts";

/** What every /minesweeper subcommand gets: the interaction (in a server) and the games table. */
export interface CommandCtx {
  i: ChatInputCommandInteraction;
  guildId: string;
  ctx: Ctx;
  store: GameStore;
}

export type Handler = (c: CommandCtx) => Promise<void>;
