import { keyedLock } from "../../../core/scheduler.ts";
import { COOL_DOWN_WEEKS } from "../banner/eligible.ts";
import { settleBanner } from "../banner/settle.ts";
import { weekOf } from "../banner/week.ts";
import { gachaTimeZone } from "../settings.ts";
import type { Banner } from "../types.ts";
import { announceBanner } from "./announce.ts";
import { readTallies } from "./tallies.ts";
import type { WeeklyDeps } from "./types.ts";

/** Per server, so the job and a command starting the same week can't both settle it. */
const lock = keyedLock();

async function start(d: WeeklyDeps, guildId: string): Promise<Banner> {
  const { repo } = d;
  const week = weekOf(d.now, gachaTimeZone(repo.db, guildId));
  const kept = repo.banners.get(guildId, week.start);

  if (kept) return kept;

  const polls = await readTallies(d.rest, repo.polls.forWeek(guildId, week.start));
  const recent = repo.banners.before(guildId, week.start, COOL_DOWN_WEEKS);
  const featured = settleBanner({ polls, pools: d.roster.pools, recent }, d.random);
  const banner: Banner = {
    guildId,
    week: week.start,
    featured,
    voted: { five: polls.five !== null, fours: polls.fours !== null },
    startedAt: d.now,
  };

  if (repo.banners.add(banner)) await announceBanner(d, { banner, week });

  return repo.banners.get(guildId, week.start) ?? banner;
}

/**
 * This week's limited banner, started now if the week has none: the polls' winners (ties and
 * empty polls at random), or random eligible drivers. A new banner is announced once.
 */
export const ensureBanner = (d: WeeklyDeps, guildId: string): Promise<Banner> =>
  lock(guildId, () => start(d, guildId));
