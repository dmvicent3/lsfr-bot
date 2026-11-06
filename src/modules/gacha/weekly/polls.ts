import { log } from "../../../core/log.ts";
import { postPoll } from "../../../core/polls/post.ts";
import { COOL_DOWN_WEEKS } from "../banner/eligible.ts";
import { pollOptions } from "../banner/settle.ts";
import { nextWeekStart, pollHours, pollsDue, weekOf } from "../banner/week.ts";
import { gachaChannel, gachaTimeZone } from "../settings.ts";
import { pollRequest } from "../text/polls.ts";
import type { PollKind, StoredPoll } from "../types.ts";
import type { WeeklyDeps } from "./types.ts";

interface Posting {
  guildId: string;
  week: string;
  channelId: string;
  hours: number;
}

/** Posts one poll and records it; a failed post is recorded without a message, so it isn't retried. */
async function post(d: WeeklyDeps, p: Posting, kind: PollKind, ids: string[]): Promise<void> {
  const drivers = ids.flatMap((id) => d.roster.byId.get(id) ?? []);
  const base: StoredPoll = { ...p, kind, messageId: null, options: ids, endsAt: d.now };
  let posted = null;

  try {
    posted = await postPoll(d.rest, p.channelId, pollRequest(kind, drivers, p.hours), d.now);
  } catch (err) {
    log.error("gacha:polls", `posting the ${kind} poll in ${p.channelId} failed`, err);
  }

  d.repo.polls.add(posted ? { ...base, ...posted } : base);
}

/**
 * From Thursday noon, once a week: the two polls for next week's banner, closing an hour before
 * the reset. Without a channel nothing is posted and next week is picked at random.
 */
export async function postPollsIfDue(d: WeeklyDeps, guildId: string): Promise<void> {
  const { repo } = d;
  const week = weekOf(d.now, gachaTimeZone(repo.db, guildId));
  const next = nextWeekStart(week.start);
  const channelId = gachaChannel(repo.db, guildId);
  const hours = pollHours(d.now, week);

  if (!pollsDue(d.now, week) || hours === null || !channelId) return;

  if (Object.keys(repo.polls.forWeek(guildId, next)).length > 0) return;

  const recent = repo.banners.before(guildId, next, COOL_DOWN_WEEKS);
  const options = pollOptions({ pools: d.roster.pools, recent }, d.random);
  const p = { guildId, week: next, channelId, hours };
  await post(d, p, "five", options.five);
  await post(d, p, "fours", options.fours);
}
