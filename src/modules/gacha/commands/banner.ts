import { nextWeekStart, weekOf } from "../banner/week.ts";
import { gachaChannel, gachaTimeZone } from "../settings.ts";
import { bannerText, pollStatus } from "../text/banner.ts";
import { BANNER_FILE, bannerImage, featuredDrivers } from "../weekly/announce.ts";
import { ensureBanner } from "../weekly/ensure.ts";
import { weeklyDeps } from "../weekly/job.ts";
import type { CommandCtx } from "./types.ts";

/** Public: this week's featured drivers with the banner image, and how next week is chosen. */
export async function banner(c: CommandCtx): Promise<void> {
  const { i, who, repo, roster } = c;
  await i.deferReply();
  const current = await ensureBanner(weeklyDeps(c.ctx, c.random), who.guildId);
  const tz = gachaTimeZone(repo.db, who.guildId);
  const week = weekOf(Date.now(), tz);
  const polls = Object.values(repo.polls.forWeek(who.guildId, nextWeekStart(week.start)));
  const status = pollStatus({ polls, channelId: gachaChannel(repo.db, who.guildId), week });
  const content = `${bannerText({ banner: current, week, ...featuredDrivers(roster, current) })}\n${status}`;
  const attachment = bannerImage({ roster, banner: current, week, tz });

  await i.editReply({
    content,
    files: [{ attachment, name: BANNER_FILE }],
    allowedMentions: { parse: [] },
  });
}
