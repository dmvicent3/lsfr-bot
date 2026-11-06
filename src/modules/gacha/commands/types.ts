import type { ChatInputCommandInteraction } from "discord.js";
import type { PlayerRef, PointsSource } from "../../../core/points-types.ts";
import type { Ctx } from "../../../core/types.ts";
import type { GachaRepo } from "../store/repo.ts";
import type { Roster } from "../types.ts";

/** What every /gacha subcommand gets. */
export interface CommandCtx {
  i: ChatInputCommandInteraction;
  ctx: Ctx;
  /** The caller, in the server. */
  who: PlayerRef;
  repo: GachaRepo;
  roster: Roster;
  sources: readonly PointsSource[];
  random: () => number;
}

export type Handler = (c: CommandCtx) => Promise<void>;
