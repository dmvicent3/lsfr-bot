import {
  type Guild,
  RateLimitError,
  RESTJSONErrorCodes,
  type Role,
  type TextChannel,
} from "discord.js";
import { log } from "../../core/log.ts";
import type { Ctx, Job } from "../../core/module.ts";
import { safely } from "../../core/scheduler.ts";
import {
  deleteSeriesChannel,
  fetchSeriesChannel,
  fetchSeriesRole,
  isDiscordError,
  updatePinned,
} from "./channels.ts";
import { collectResults } from "./collect-results.ts";
import { currentEvent, PING_DELETE_AFTER_MS, sessionsToPing, shouldRename } from "./decisions.ts";
import { getLeadMinutes } from "./lead.ts";
import { memberLoader } from "./members.ts";
import { refreshAll, refreshWeather } from "./refresh.ts";
import { renderPing } from "./render.ts";
import { type Followed, MotorsportRepo } from "./repo.ts";
import { seriesInfo } from "./series.ts";
import { channelName } from "./time.ts";

async function guildOf(ctx: Ctx): Promise<Guild> {
  return ctx.client.guilds.fetch(ctx.config.guildId);
}

const refresh: Job = {
  name: "refresh",
  cron: "0 */6 * * *",
  runOnStart: true,
  async run(ctx) {
    const repo = new MotorsportRepo(ctx.db);
    const now = new Date();
    const results = await refreshAll(repo, now);
    log.info(
      "motorsport:refresh",
      results.map((r) => `${r.series}:${r.ok ? "ok" : "failed"}`).join(" "),
    );
    await refreshWeather(repo, now);
    const guild = await guildOf(ctx);
    for (const f of repo.listFollowed()) {
      await safely(`motorsport:refresh:${f.series}`, async () => {
        const channel = await fetchSeriesChannel(guild, f);
        if (channel) await updatePinned(channel, repo, f, now.getTime());
      });
    }
  },
};

const ensureMembers = memberLoader();

async function sendPings(
  guild: Guild,
  repo: MotorsportRepo,
  f: Followed,
  channel: TextChannel,
  role: Role,
  leadMs: number,
  now: number,
): Promise<void> {
  const due = sessionsToPing(repo.listSessions(f.series), repo.sentKeys(f.series), leadMs, now);
  if (due.length === 0) return;
  await ensureMembers(guild);
  const roleMemberIds = new Set(role.members.keys());
  for (const session of due) {
    const payload = renderPing({
      info: seriesInfo(f.series),
      session,
      roleId: role.id,
      roleHasMembers: roleMemberIds.size > 0,
      roleMemberIds,
      oneOffUserIds: repo.oneOffUsers(f.series, session.eventId, session.sessionId),
    });
    const message = payload
      ? await channel.send({ content: payload.content, allowedMentions: payload.allowedMentions })
      : null;
    repo.insertSentPing({
      series: f.series,
      eventId: session.eventId,
      sessionId: session.sessionId,
      channelId: channel.id,
      messageId: message?.id ?? null,
      deleteAt: session.start.getTime() + PING_DELETE_AFTER_MS,
    });
    repo.clearOneOff(f.series, session.eventId, session.sessionId);
    log.info("motorsport:tick", `${f.series} ${session.eventId}/${session.sessionId} pinged`);
  }
}

async function tickSeries(guild: Guild, repo: MotorsportRepo, f: Followed, leadMs: number) {
  const now = Date.now();
  const [channel, role] = await Promise.all([
    fetchSeriesChannel(guild, f),
    fetchSeriesRole(guild, f),
  ]);
  if (!channel || !role) {
    log.info("motorsport:tick", `${f.series} channel or role was deleted, unfollowing`);
    await deleteSeriesChannel(guild, f);
    repo.deleteSeries(f.series);
    return;
  }

  // Pings first: they are time-critical, the rename is cosmetic.
  await sendPings(guild, repo, f, channel, role, leadMs, now);

  const sessions = repo.listSessions(f.series);
  if ((currentEvent(sessions, now)?.eventId ?? null) !== f.pinnedEventId) {
    await updatePinned(channel, repo, f, now);
  }

  const desired = channelName(f.series, sessions, new Date(now));
  if (shouldRename(f.channelName, desired, f.renamedAt, now)) {
    try {
      await channel.setName(desired);
      repo.updateFollowed(f.series, { channelName: desired, renamedAt: now });
    } catch (err) {
      if (!(err instanceof RateLimitError)) throw err;
      // Someone else used the rename budget; back off for one throttle window.
      repo.updateFollowed(f.series, { renamedAt: now });
      log.info("motorsport:tick", `${f.series} rename rate-limited, retrying later`);
    }
  }
}

const tick: Job = {
  name: "tick",
  cron: "* * * * *",
  async run(ctx) {
    const repo = new MotorsportRepo(ctx.db);
    const followed = repo.listFollowed();
    if (followed.length === 0) return;
    const guild = await guildOf(ctx);
    const leadMs = getLeadMinutes(ctx.db) * 60_000;
    for (const f of followed) {
      await safely(`motorsport:tick:${f.series}`, () => tickSeries(guild, repo, f, leadMs));
    }
  },
};

const cleanup: Job = {
  name: "cleanup",
  cron: "* * * * *",
  async run(ctx) {
    const repo = new MotorsportRepo(ctx.db);
    const due = repo.duePingDeletes(Date.now());
    if (due.length === 0) return;
    const guild = await guildOf(ctx);
    for (const ping of due) {
      await safely(`motorsport:cleanup:${ping.series}`, async () => {
        try {
          const channel = await guild.channels.fetch(ping.channelId);
          if (channel?.isTextBased()) await channel.messages.delete(ping.messageId);
        } catch (err) {
          const gone =
            isDiscordError(err, RESTJSONErrorCodes.UnknownChannel) ||
            isDiscordError(err, RESTJSONErrorCodes.UnknownMessage);
          if (!gone) throw err;
        }
        repo.markPingDeleted(ping.series, ping.eventId, ping.sessionId);
      });
    }
  },
};

/** Posts session results (spoilered) into followed series channels as they get published. */
const results: Job = {
  name: "results",
  cron: "*/5 * * * *",
  runOnStart: true,
  async run(ctx) {
    const repo = new MotorsportRepo(ctx.db);
    await collectResults(repo, Date.now(), fetch, async (series, content) => {
      const f = repo.getFollowed(series);
      if (!f) return;
      const channel = await fetchSeriesChannel(await guildOf(ctx), f);
      if (channel) await channel.send({ content, allowedMentions: { parse: [] } });
    });
  },
};

export const motorsportJobs: Job[] = [refresh, tick, cleanup, results];
