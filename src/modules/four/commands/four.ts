import type { ChatInputCommandInteraction } from "discord.js";
import { reply } from "../../../core/replies.ts";
import type { Ctx, SlashCommand } from "../../../core/types.ts";
import { FourRepo } from "../store/repo.ts";
import { leaderboard, stats } from "./boards.ts";
import { data } from "./data.ts";
import { play } from "./play.ts";
import type { Handler, PlayDeps } from "./types.ts";

const HANDLERS: Record<string, Handler> = { play, stats, leaderboard };

export function fourCommand(d: PlayDeps): SlashCommand {
  async function execute(i: ChatInputCommandInteraction, ctx: Ctx): Promise<void> {
    const handler = HANDLERS[i.options.getSubcommand()];

    if (!i.guildId) return reply(i, "Use this in a server.");

    if (!handler) return reply(i, "Unknown subcommand.");

    await handler({ i, guildId: i.guildId, ctx, repo: new FourRepo(ctx.db), d });
  }

  return { data, execute };
}
