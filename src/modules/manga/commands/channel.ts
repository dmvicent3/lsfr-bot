import { PermissionFlagsBits } from "discord.js";
import { reply } from "../../../core/replies.ts";
import { setMangaChannel } from "../settings.ts";
import type { CommandCtx } from "./types.ts";

/** Manage Server only; checked here since the other subcommands are for everyone. */
export async function channel({ i, db }: CommandCtx): Promise<void> {
  if (!i.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    return reply(i, "Only members with Manage Server can set the manga channel.");
  }

  const channelId = i.options.getChannel("channel", true).id;
  setMangaChannel(db, channelId);
  await reply(i, `Manga chapters will be posted in <#${channelId}>.`);
}
