import type { CommandCtx, Handler } from "./types.ts";
import { ButtonStyle, ComponentType, type Guild, MessageFlags } from "discord.js";
import { log } from "../../../core/log.ts";
import { currentEvent } from "../channels/decisions.ts";
import { guildOf } from "../channels/lookup.ts";
import { renderSchedule } from "../channels/render.ts";
import { createSeriesChannel } from "../channels/setup.ts";
import { followErrorText } from "../errors.ts";
import { notFollowedText } from "../pings/actions.ts";
import type { MotorsportRepo } from "../repo.ts";
import { seriesInfo } from "../series.ts";
import type { SeriesKey } from "../types.ts";
import { reply, seriesOption } from "./kit.ts";

/** Series with a follow in flight, so a double submit can't create two channels. */
const following = new Set<SeriesKey>();

async function follow({ i, ctx, repo }: CommandCtx): Promise<void> {
  const series = seriesOption(i);
  const { name } = seriesInfo(series);
  const existing = repo.followed.get(series);
  if (existing) return reply(i, `${name} is already followed in <#${existing.channelId}>.`);
  if (following.has(series)) return reply(i, `${name} is already being set up.`);
  following.add(series);
  try {
    await i.deferReply({ flags: MessageFlags.Ephemeral });
    const channelId = await setUpSeries(repo, await guildOf(ctx), series);
    await i.editReply(`Following ${name} in <#${channelId}>.`);
  } catch (err) {
    log.error("motorsport:follow", `${series} failed`, err);
    await i.editReply(followErrorText(err));
  } finally {
    following.delete(series);
  }
}

/**
 * Creates the channel and role, pins the schedule and stores the follow; returns the channel
 * id. A failure after the channel exists deletes the channel and role again.
 */
async function setUpSeries(repo: MotorsportRepo, guild: Guild, series: SeriesKey): Promise<string> {
  const info = seriesInfo(series);
  const { channel, role } = await createSeriesChannel(guild, info);
  try {
    const event = currentEvent(repo.sessions.list(series), Date.now());
    const message = await channel.send(renderSchedule(info, event, repo.weather.bySession(series)));
    await message.pin();
    repo.followed.insert({
      series,
      channelId: channel.id,
      roleId: role.id,
      pinnedMessageId: message.id,
      pinnedEventId: event?.eventId ?? null,
      channelName: null,
      renamedAt: null,
    });
    return channel.id;
  } catch (err) {
    await Promise.allSettled([channel.delete(), role.delete()]);
    throw err;
  }
}

/** Asks first: the button deletes the channel and role. */
async function unfollow({ i, repo }: CommandCtx): Promise<void> {
  const series = seriesOption(i);
  const followed = repo.followed.get(series);
  if (!followed) return reply(i, notFollowedText(series));
  const { name } = seriesInfo(series);
  const button = {
    type: ComponentType.Button as const,
    custom_id: `motorsport:unfollow:${series}`,
    label: "Unfollow",
    style: ButtonStyle.Danger as const,
  };
  await i.reply({
    content: `Unfollow ${name}? This deletes <#${followed.channelId}> and the @${name} role.`,
    flags: MessageFlags.Ephemeral,
    components: [{ type: ComponentType.ActionRow, components: [button] }],
  });
}

export const followHandlers: Record<string, Handler> = { follow, unfollow };
