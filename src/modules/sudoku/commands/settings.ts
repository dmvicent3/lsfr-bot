import { PermissionFlagsBits } from "discord.js";
import { reply } from "../../../core/replies.ts";
import { saveSudokuTimeZone } from "../settings.ts";
import type { CommandCtx } from "./types.ts";

/** Manage Server only; checked here since the other subcommands are for everyone. */
export async function settings({ i, guildId, db }: CommandCtx): Promise<void> {
  if (!i.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    return reply(i, "Only members with Manage Server can change the sudoku settings.");
  }

  const timeZone = i.options.getString("timezone", true).trim();
  const error = saveSudokuTimeZone(db, guildId, timeZone);

  await reply(i, error ?? `Time zone set to ${timeZone}. Applies from the next puzzle.`);
}
