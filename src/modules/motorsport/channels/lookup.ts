import type { SeriesChannel } from "./types.ts";
import {
  ChannelType,
  DiscordAPIError,
  type Guild,
  type GuildBasedChannel,
  RESTJSONErrorCodes,
  type Role,
} from "discord.js";
import type { Ctx } from "../../../core/types.ts";
import type { Followed } from "../types.ts";

export async function guildOf(ctx: Ctx): Promise<Guild> {
  return ctx.client.guilds.fetch(ctx.config.guildId);
}

export function isSeriesChannelType(type: ChannelType): boolean {
  return type === ChannelType.GuildText || type === ChannelType.GuildAnnouncement;
}

function isSeriesChannel(channel: GuildBasedChannel | null): channel is SeriesChannel {
  return channel !== null && isSeriesChannelType(channel.type);
}

export function isDiscordError(err: unknown, code: RESTJSONErrorCodes): boolean {
  return err instanceof DiscordAPIError && err.code === code;
}

/** The series' text channel, or null when it no longer exists. */
export async function fetchSeriesChannel(guild: Guild, f: Followed): Promise<SeriesChannel | null> {
  try {
    const channel = await guild.channels.fetch(f.channelId);

    return isSeriesChannel(channel) ? channel : null;
  } catch (err) {
    if (isDiscordError(err, RESTJSONErrorCodes.UnknownChannel)) return null;

    throw err;
  }
}

export async function fetchSeriesRole(guild: Guild, f: Followed): Promise<Role | null> {
  try {
    return await guild.roles.fetch(f.roleId);
  } catch (err) {
    if (isDiscordError(err, RESTJSONErrorCodes.UnknownRole)) return null;

    throw err;
  }
}
