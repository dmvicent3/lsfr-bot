import { log } from "../../../core/log.ts";
import type { Week } from "../banner/types.ts";
import { bannerPng } from "../render/images.ts";
import { gachaChannel, gachaTimeZone } from "../settings.ts";
import { newBannerText } from "../text/banner.ts";
import type { Banner, Driver, Roster } from "../types.ts";
import type { WeeklyDeps } from "./types.ts";

export const BANNER_FILE = "gacha-banner.png";

/** The featured drivers of a banner; throws on an id the snapshot lacks. */
export function featuredDrivers(roster: Roster, b: Banner): { five: Driver; fours: Driver[] } {
  const get = (id: string): Driver => {
    const d = roster.byId.get(id);

    if (!d) throw new Error(`gacha: no driver ${id}`);

    return d;
  };

  return { five: get(b.featured.five), fours: b.featured.fours.map(get) };
}

/** "9 Nov 2026" with the year, "Mon 16 Nov" without. */
const dayMonth = (ms: number, tz: string, year = false): string =>
  new Date(ms).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    ...(year ? { year: "numeric" } : { weekday: "short" }),
    timeZone: tz,
  });

/** The banner image: the drivers, the week, and when it ends in the server's zone. */
export function bannerImage(v: { roster: Roster; banner: Banner; week: Week; tz: string }): Buffer {
  const { five, fours } = featuredDrivers(v.roster, v.banner);
  const how = v.banner.voted.five ? "chosen by your votes" : "picked at random";

  return bannerPng({
    five,
    fours,
    title: "Limited banner",
    subtitle: `Week of ${dayMonth(v.week.startsAt, v.tz, true)} · ★5 ${how}`,
    footer: `Ends ${dayMonth(v.week.endsAt, v.tz)}, 00:00 (${v.tz}) · /gacha pull`,
  });
}

/** Posts a new banner in the gacha channel; without a channel it starts quietly. */
export async function announceBanner(
  d: WeeklyDeps,
  v: { banner: Banner; week: Week },
): Promise<void> {
  const channelId = gachaChannel(d.repo.db, v.banner.guildId);

  if (!channelId) return;

  const tz = gachaTimeZone(d.repo.db, v.banner.guildId);
  const { five } = featuredDrivers(d.roster, v.banner);
  const sent = await d.send(channelId, {
    content: newBannerText({ five, week: v.week, voted: v.banner.voted.five }),
    files: [{ attachment: bannerImage({ roster: d.roster, ...v, tz }), name: BANNER_FILE }],
  });

  if (sent.result !== "ok") log.error("gacha:banner", `announcing in ${channelId}: ${sent.result}`);
}
