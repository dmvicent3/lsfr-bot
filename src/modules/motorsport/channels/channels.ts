import type { SeriesChannel } from "./types.ts";
import {
  type CategoryChannel,
  ChannelType,
  DiscordAPIError,
  type Guild,
  type GuildBasedChannel,
  type Message,
  PermissionFlagsBits,
  RESTJSONErrorCodes,
  type Role,
  type TextChannel,
  ThreadAutoArchiveDuration,
  type ThreadChannel,
} from "discord.js";
import { keyedLock } from "../../../core/scheduler.ts";
import { currentEvent } from "./decisions.ts";
import { renderSchedule } from "./render.ts";
import type { PostTarget } from "../types.ts";
import type { MotorsportRepo } from "../repo.ts";
import type { Followed } from "../types.ts";
import { seriesInfo } from "../series.ts";
import type { SeriesInfo } from "../types.ts";

const CATEGORY_NAME = "Motorsport";

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
        { id: guild.roles.everyone.id, allow: EVERYONE_ALLOW, deny: EVERYONE_DENY },
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
    const current = repo.followed.get(f.series);
    if (current) await renderPinned(channel, repo, current, now);
  });
}

async function renderPinned(
  channel: SeriesChannel,
  repo: MotorsportRepo,
  f: Followed,
  now: number,
): Promise<void> {
  const event = currentEvent(repo.sessions.list(f.series), now);
  const payload = renderSchedule(
    seriesInfo(f.series),
    event,
    repo.weather.bySession(f.series),
    event ? repo.predictions.counts(f.series, event.eventId) : new Map(),
  );
  let message: Message;
  try {
    message = await channel.messages.fetch(f.pinnedMessageId);
    await message.edit(payload);
  } catch (err) {
    if (!isDiscordError(err, RESTJSONErrorCodes.UnknownMessage)) throw err;
    message = await channel.send(payload);
    await message.pin();
  }
  repo.followed.update(f.series, {
    pinnedMessageId: message.id,
    pinnedEventId: event?.eventId ?? null,
  });
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

const MAX_THREAD_NAME = 100;

/** Results and rulings jobs may both open a weekend's thread at once: one at a time. */
const threadLock = keyedLock();

/**
 * The weekend's results thread: the stored one (unarchived if it went quiet), or a new one
 * started from a short message in the channel when there's none or it was deleted.
 */
export async function eventThread(
  channel: SeriesChannel,
  repo: MotorsportRepo,
  target: PostTarget,
): Promise<ThreadChannel> {
  return threadLock(`${target.series}/${target.eventId}`, async () => {
    const stored = repo.threads.get(target.series, target.eventId);
    if (stored) {
      try {
        const thread = await channel.threads.fetch(stored);
        if (thread) {
          if (thread.archived) await thread.setArchived(false);
          return thread;
        }
      } catch (err) {
        if (!isDiscordError(err, RESTJSONErrorCodes.UnknownChannel)) throw err;
      }
    }
    const about = target.series === "f1" ? "results & stewards' rulings" : "results";
    const starter = await channel.send({
      content: `🏁 **${target.eventName}**: ${about} in the thread below`,
      allowedMentions: { parse: [] },
    });
    const thread = await starter.startThread({
      name: `🏁 ${target.eventName}`.slice(0, MAX_THREAD_NAME),
      autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
    });
    repo.threads.set(target.series, target.eventId, thread.id);
    return thread;
  });
}
