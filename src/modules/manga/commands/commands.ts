import type { ChatInputCommandInteraction } from "discord.js";
import { reply } from "../../../core/replies.ts";
import type { Ctx, SlashCommand } from "../../../core/types.ts";
import type { MangaDexGet } from "../api/types.ts";
import { MangaRepo } from "../store/repo.ts";
import { mangaAutocomplete } from "./autocomplete.ts";
import { channel } from "./channel.ts";
import { data } from "./data.ts";
import { follow } from "./follow.ts";
import { list } from "./list.ts";
import type { Handler } from "./types.ts";
import { unfollow } from "./unfollow.ts";

const HANDLERS: Record<string, Handler> = { follow, unfollow, list, channel };

export function mangaCommand(get: MangaDexGet): SlashCommand {
  async function execute(i: ChatInputCommandInteraction, ctx: Ctx): Promise<void> {
    const handler = HANDLERS[i.options.getSubcommand()];

    if (!handler) return reply(i, "Unknown subcommand.");

    await handler({ i, db: ctx.db, repo: new MangaRepo(ctx.db), get });
  }

  return { data, execute, autocomplete: mangaAutocomplete(get) };
}
