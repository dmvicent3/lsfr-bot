import { pageButtons } from "../../../core/page-buttons.ts";
import { rangeInstants } from "../../../core/periods.ts";
import { dateIn } from "../../../core/zoned.ts";
import { periodRange } from "../../trivia/periods.ts";
import type { Period } from "../../trivia/types.ts";
import { TRIVIA_TZ } from "../../trivia/zone.ts";
import { renderLeaderboard } from "../render/boards.ts";
import type { ShedRepo } from "../store/repo.ts";
import type { CommandCtx } from "./types.ts";

const PERIODS: readonly Period[] = ["today", "week", "month", "all"];

/** The period named, else this week. */
export const toShedPeriod = (s: string | null | undefined): Period =>
  PERIODS.find((p) => p === s) ?? "week";

/** A leaderboard page as of `now`; the slash command and the page buttons both send this. */
export function leaderboardView(
  repo: ShedRepo,
  v: { guildId: string; period: Period; page: number; viewerId: string; now: number },
) {
  const range = periodRange(v.period, dateIn(v.now, TRIVIA_TZ));
  const { from, to } = rangeInstants(range, TRIVIA_TZ);
  const list = repo.places.standings(v.guildId, from, to);
  const page = renderLeaderboard({ range, list, page: v.page, viewerId: v.viewerId });

  return {
    content: page.content,
    components: pageButtons("shed:lb", v.period, page.page, page.pages),
    allowedMentions: { parse: [] },
  };
}

/** Public, so the server sees it; mentions never ping. */
export async function leaderboard({ i, guildId, repo }: CommandCtx): Promise<void> {
  const period = toShedPeriod(i.options.getString("period"));
  const page = i.options.getInteger("page") ?? 1;
  await i.reply(
    leaderboardView(repo, { guildId, period, page, viewerId: i.user.id, now: Date.now() }),
  );
}
