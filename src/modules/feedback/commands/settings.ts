import { PermissionFlagsBits } from "discord.js";
import { reply } from "../../../core/replies.ts";
import { setPollChannel } from "../settings.ts";
import type { CommandCtx } from "./types.ts";

/** Manage Server only; checked here since `give` is for everyone. */
export async function settings({ i, guildId, db }: CommandCtx): Promise<void> {
  if (!i.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    return reply(i, "Only members with Manage Server can change the feedback settings.");
  }

  const channelId = i.options.getChannel("channel", true).id;
  setPollChannel(db, guildId, channelId);
  await reply(i, `Polls will be posted in <#${channelId}>.`);
}
