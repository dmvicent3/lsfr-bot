import {
  type CategoryChannel,
  ChannelType,
  DiscordAPIError,
  type Guild,
  type GuildBasedChannel,
  type Message,
  type NewsChannel,
  PermissionFlagsBits,
  RESTJSONErrorCodes,
  type Role,
  type TextChannel,
} from "discord.js";
import { keyedLock } from "../../core/scheduler.ts";
import { currentEvent } from "./decisions.ts";
import { renderSchedule } from "./render.ts";
import type { Followed, MotorsportRepo } from "./repo.ts";
import { seriesInfo, type SeriesInfo } from "./series.ts";

const CATEGORY_NAME = "Motorsport";

/** The series channel; admins may turn it into an announcement channel, which still works. */
export type SeriesChannel = TextChannel | NewsChannel;

export function isSeriesChannelType(type: ChannelType): boolean {
  return type === ChannelType.GuildText || type === ChannelType.GuildAnnouncement;
}

function isSeriesChannel(channel: GuildBasedChannel | null): channel is SeriesChannel {
  return channel !== null && isSeriesChannelType(channel.type);
}

export const BOT_CHANNEL_PERMISSIONS = [
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.SendMessages,
  PermissionFlagsBits.ManageMessages,
  PermissionFlagsBits.PinMessages,
  PermissionFlagsBits.ManageChannels,
  PermissionFlagsBits.ReadMessageHistory,
];

export function isDiscordError(err: unknown, code: RESTJSONErrorCodes): boolean {
  return err instanceof DiscordAPIError && err.code === code;
}

export async function ensureCategory(guild: Guild): Promise<CategoryChannel> {
  const channels = await guild.channels.fetch();
  const existing = channels.find(
    (c): c is CategoryChannel => c?.type === ChannelType.GuildCategory && c.name === CATEGORY_NAME,
  );
  return (
    existing ?? guild.channels.create({ name: CATEGORY_NAME, type: ChannelType.GuildCategory })
  );
}

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
  const channel = await guild.channels
    .create({
      name: info.key,
      type: ChannelType.GuildText,
      parent: category.id,
      topic: `${info.name} schedule. Use the 🔔 button on the pinned message for pings.`,
      permissionOverwrites: [
        {
          id: guild.roles.everyone.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
          deny: [
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.AddReactions,
            PermissionFlagsBits.CreatePublicThreads,
            PermissionFlagsBits.CreatePrivateThreads,
            PermissionFlagsBits.SendMessagesInThreads,
          ],
        },
        {
          id: me.id,
          allow: BOT_CHANNEL_PERMISSIONS,
        },
      ],
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

/** Refresh and tick both update pinned schedules; one series at a time, or both re-post. */
const pinnedLock = keyedLock();

/**
 * Re-renders the pinned schedule for the event that is current at `now`. Re-posts and pins
 * it if someone deleted the original.
 */
export async function updatePinned(
  channel: SeriesChannel,
  repo: MotorsportRepo,
  f: Followed,
  now: number,
): Promise<void> {
  await pinnedLock(f.series, async () => {
    // Re-read: another run may have re-posted (and re-pointed) the message meanwhile.
    const current = repo.getFollowed(f.series);
    if (current) await renderPinned(channel, repo, current, now);
  });
}

async function renderPinned(
  channel: SeriesChannel,
  repo: MotorsportRepo,
  f: Followed,
  now: number,
): Promise<void> {
  const event = currentEvent(repo.listSessions(f.series), now);
  const payload = renderSchedule(seriesInfo(f.series), event, repo.weatherFor(f.series));
  let message: Message;
  try {
    message = await channel.messages.fetch(f.pinnedMessageId);
    await message.edit(payload);
  } catch (err) {
    if (!isDiscordError(err, RESTJSONErrorCodes.UnknownMessage)) throw err;
    message = await channel.send(payload);
    await message.pin();
  }
  repo.updateFollowed(f.series, {
    pinnedMessageId: message.id,
    pinnedEventId: event?.eventId ?? null,
  });
}
