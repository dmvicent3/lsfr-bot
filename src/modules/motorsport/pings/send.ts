import type { PingTarget, TickRun } from "./types.ts";
import type { Role } from "discord.js";
import { log } from "../../../core/log.ts";
import type { SeriesChannel } from "../channels/types.ts";
import { PING_DELETE_AFTER_MS, sessionsToPing } from "../channels/decisions.ts";
import { memberLoader } from "./members.ts";
import { renderPing } from "./render.ts";
import { seriesInfo } from "../series.ts";
import type { Session } from "../types.ts";

/** Role member lists come from the guild member cache, loaded once per process. */
const ensureMembers = memberLoader();

/** Pings every session now within the lead time, once each. */
export async function sendPings(run: TickRun, channel: SeriesChannel, role: Role): Promise<void> {
  const { guild, repo, followed: f, leadMs, now } = run;
  const due = sessionsToPing(
    repo.sessions.list(f.series),
    repo.pings.sentKeys(f.series),
    leadMs,
    now,
  );

  if (due.length === 0) return;

  await ensureMembers(guild);
  const target = { channel, role, roleMemberIds: new Set(role.members.keys()) };

  for (const session of due) await pingSession(run, target, session);
}

/** Sends one ping (or records that nobody wanted it) and clears its one-off reminders. */
async function pingSession(
  { repo, followed: f }: TickRun,
  { channel, role, roleMemberIds }: PingTarget,
  session: Session,
): Promise<void> {
  const { eventId, sessionId } = session;
  const payload = renderPing({
    info: seriesInfo(f.series),
    session,
    roleId: role.id,
    roleHasMembers: roleMemberIds.size > 0,
    roleMemberIds,
    oneOffUserIds: repo.reminders.users(f.series, eventId, sessionId),
  });
  const message = payload
    ? await channel.send({ content: payload.content, allowedMentions: payload.allowedMentions })
    : null;
  repo.pings.insert({
    series: f.series,
    eventId,
    sessionId,
    channelId: channel.id,
    messageId: message?.id ?? null,
    deleteAt: session.start.getTime() + PING_DELETE_AFTER_MS,
  });
  repo.reminders.clear(f.series, eventId, sessionId);
  log.info("motorsport:tick", `${f.series} ${eventId}/${sessionId} pinged`);
}
