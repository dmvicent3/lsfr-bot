import type { SeriesChannel } from "./types.ts";
import {
  type CategoryChannel,
  ChannelType,
  type Guild,
  PermissionFlagsBits,
  RESTJSONErrorCodes,
  type Role,
  type TextChannel,
} from "discord.js";
import { isDiscordError } from "./lookup.ts";
import type { Followed, SeriesInfo } from "../types.ts";

const CATEGORY_NAME = "Motorsport";

export const BOT_CHANNEL_PERMISSIONS = [
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.SendMessages,
  PermissionFlagsBits.ManageMessages,
  PermissionFlagsBits.PinMessages,
  PermissionFlagsBits.ManageChannels,
  PermissionFlagsBits.ReadMessageHistory,
  PermissionFlagsBits.CreatePublicThreads,
  PermissionFlagsBits.SendMessagesInThreads,
  PermissionFlagsBits.ManageThreads,
];

/** Everyone reads the channel and talks in the bot's weekend threads, nothing else. */
const EVERYONE_ALLOW = [
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.ReadMessageHistory,
  PermissionFlagsBits.SendMessagesInThreads,
];
const EVERYONE_DENY = [
  PermissionFlagsBits.SendMessages,
  PermissionFlagsBits.AddReactions,
  PermissionFlagsBits.CreatePublicThreads,
  PermissionFlagsBits.CreatePrivateThreads,
];

export async function ensureCategory(guild: Guild): Promise<CategoryChannel> {
  const channels = await guild.channels.fetch();
  const existing = channels.find(
    (c): c is CategoryChannel => c?.type === ChannelType.GuildCategory && c.name === CATEGORY_NAME,
  );

  return (
    existing ?? guild.channels.create({ name: CATEGORY_NAME, type: ChannelType.GuildCategory })
  );
}

/** A new channel and pings role for the series; the role is removed if the channel fails. */
export async function createSeriesChannel(
  guild: Guild,
  info: SeriesInfo,
): Promise<{ channel: TextChannel; role: Role }> {
  const me = await guild.members.fetchMe();
  const category = await ensureCategory(guild);
  const role = await guild.roles.create({
    name: info.name,
    mentionable: true,
    reason: `Season pings for ${info.name}`,
  });
  const permissionOverwrites = [
    { id: guild.roles.everyone.id, allow: EVERYONE_ALLOW, deny: EVERYONE_DENY },
    { id: me.id, allow: BOT_CHANNEL_PERMISSIONS },
  ];
  const channel = await guild.channels
    .create({
      name: info.key,
      type: ChannelType.GuildText,
      parent: category.id,
      topic: `${info.name} schedule. Use the 🔔 button on the pinned message for pings.`,
      permissionOverwrites,
    })
    .catch(async (err: unknown) => {
      await role.delete().catch(() => undefined);
      throw err;
    });

  return { channel, role };
}

export async function deleteSeriesChannel(guild: Guild, f: Followed): Promise<void> {
  try {
    await guild.channels.delete(f.channelId, "Series unfollowed");
  } catch (err) {
    if (!isDiscordError(err, RESTJSONErrorCodes.UnknownChannel)) throw err;
  }

  try {
    await guild.roles.delete(f.roleId, "Series unfollowed");
  } catch (err) {
    if (!isDiscordError(err, RESTJSONErrorCodes.UnknownRole)) throw err;
  }
}

const permissionsUpdated = new Set<string>();

/**
 * Brings a channel made before weekend threads up to date: people may talk in threads, the
 * bot may create and manage them. Once per channel per process.
 */
export async function ensureThreadPermissions(channel: SeriesChannel): Promise<void> {
  if (permissionsUpdated.has(channel.id)) return;

  const me = await channel.guild.members.fetchMe();
  await channel.permissionOverwrites.edit(channel.guild.roles.everyone, {
    SendMessagesInThreads: true,
  });
  await channel.permissionOverwrites.edit(me, {
    CreatePublicThreads: true,
    SendMessagesInThreads: true,
    ManageThreads: true,
  });
  permissionsUpdated.add(channel.id);
}
