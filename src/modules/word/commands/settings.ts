import { PermissionFlagsBits } from "discord.js";
import { reply } from "../../../core/replies.ts";
import { saveWordSettings, wordSettings } from "../settings.ts";
import type { WordSettings } from "../types.ts";
import type { CommandCtx } from "./types.ts";

/** Manage Server only; checked here since the other subcommands are for everyone. */
export async function settings({ i, guildId, db }: CommandCtx): Promise<void> {
  if (!i.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    return reply(i, "Only members with Manage Server can change the word settings.");
  }

  const length = i.options.getInteger("length");
  const timeZone = i.options.getString("timezone")?.trim();
  const change: Partial<WordSettings> = {
    ...(length === null ? {} : { length }),
    ...(timeZone ? { timeZone } : {}),
  };

  if (Object.keys(change).length === 0) {
    const now = wordSettings(db, guildId);

    return reply(i, `Words are ${now.length} letters; days start at midnight ${now.timeZone}.`);
  }

  await reply(i, saveWordSettings(db, guildId, change) ?? "Saved. Applies from the next puzzle.");
}
