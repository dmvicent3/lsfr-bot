import type { Database } from "bun:sqlite";
import { type ChatInputCommandInteraction, PermissionFlagsBits } from "discord.js";
import { reply } from "./replies.ts";

interface ZoneCtx {
  i: ChatInputCommandInteraction;
  guildId: string;
  db: Database;
}

/** The `settings` subcommand of a module whose only setting is its time zone. Manage Server only; checked here since the other subcommands are for everyone. */
// oxlint-disable-next-line typescript/no-unnecessary-type-parameters -- each module's context carries more than ZoneCtx, and the handler must accept it as is
export function zoneSettingsHandler<C extends ZoneCtx>(
  label: string,
  save: (db: Database, guildId: string, tz: string) => string | null,
): (c: C) => Promise<void> {
  return async ({ i, guildId, db }) => {
    if (!i.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
      return reply(i, `Only members with Manage Server can change the ${label} settings.`);
    }

    const timeZone = i.options.getString("timezone", true).trim();

    await reply(
      i,
      save(db, guildId, timeZone) ?? `Time zone set to ${timeZone}. Applies from the next puzzle.`,
    );
  };
}
