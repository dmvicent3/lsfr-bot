import { PermissionFlagsBits } from "discord.js";
import { reply } from "../../../core/replies.ts";
import { saveGachaPrice, saveGachaTimeZone, setGachaChannel } from "../settings.ts";
import type { CommandCtx } from "./types.ts";

/** Manage Server only; checked here since the other subcommands are for everyone. */
export async function settings({ i, who, repo }: CommandCtx): Promise<void> {
  if (!i.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    return reply(i, "Only members with Manage Server can change the gacha settings.");
  }

  const channel = i.options.getChannel("channel");
  const price = i.options.getInteger("price");
  const tz = i.options.getString("timezone")?.trim();
  const said: string[] = [];

  if (channel) {
    setGachaChannel(repo.db, who.guildId, channel.id);
    said.push(
      `Banner polls and news go to <#${channel.id}>. Gork needs to send messages and polls there.`,
    );
  }

  if (price !== null)
    said.push(saveGachaPrice(repo.db, who.guildId, price) ?? `A pull now costs ${price}.`);

  if (tz)
    said.push(
      saveGachaTimeZone(repo.db, who.guildId, tz) ??
        `The week now runs in ${tz}, from the next banner.`,
    );

  await reply(
    i,
    said.length > 0 ? said.join("\n") : "Pick a channel, a price or a time zone to change.",
  );
}
