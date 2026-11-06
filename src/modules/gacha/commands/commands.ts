import type { ChatInputCommandInteraction } from "discord.js";
import type { PointsSource } from "../../../core/points-types.ts";
import { reply } from "../../../core/replies.ts";
import type { Ctx, SlashCommand } from "../../../core/types.ts";
import { ROSTER } from "../data/roster.ts";
import { GachaRepo } from "../store/repo.ts";
import { balance } from "./balance.ts";
import { banner } from "./banner.ts";
import { collection } from "./collection.ts";
import { data } from "./data.ts";
import { history } from "./history.ts";
import { pull } from "./pull.ts";
import { settings } from "./settings.ts";
import type { Handler } from "./types.ts";

const HANDLERS: Record<string, Handler> = { pull, banner, balance, collection, history, settings };

export function gachaCommand(sources: readonly PointsSource[], random: () => number): SlashCommand {
  async function execute(i: ChatInputCommandInteraction, ctx: Ctx): Promise<void> {
    const handler = HANDLERS[i.options.getSubcommand()];

    if (!i.guildId) return reply(i, "Gacha works in a server.");

    if (!handler) return reply(i, "Unknown subcommand.");

    const who = { guildId: i.guildId, userId: i.user.id };
    const repo = new GachaRepo(ctx.db);
    await handler({ i, ctx, who, repo, roster: ROSTER, sources, random });
  }

  return { data, execute };
}
