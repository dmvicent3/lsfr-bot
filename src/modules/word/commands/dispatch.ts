import type {
  ChatInputCommandInteraction,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
} from "discord.js";
import { reply } from "../../../core/replies.ts";
import type { Ctx, SlashCommand } from "../../../core/types.ts";
import { WordRepo } from "../store/repo.ts";
import type { Handler } from "./types.ts";

/** A word-game command: in a server only, each subcommand to its handler. */
export function dispatch(
  data: RESTPostAPIChatInputApplicationCommandsJSONBody,
  handlers: Record<string, Handler>,
  random: () => number,
): SlashCommand {
  async function execute(i: ChatInputCommandInteraction, ctx: Ctx): Promise<void> {
    const handler = handlers[i.options.getSubcommand()];

    if (!i.guildId) return reply(i, "The word games work in a server.");

    if (!handler) return reply(i, "Unknown subcommand.");

    await handler({ i, guildId: i.guildId, db: ctx.db, repo: new WordRepo(ctx.db), random });
  }

  return { data, execute };
}
