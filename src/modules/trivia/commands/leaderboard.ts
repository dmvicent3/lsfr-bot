import { pageButtons } from "../../../core/page-buttons.ts";
import { rangeInstants } from "../../../core/periods.ts";
import { dateIn } from "../../../core/zoned.ts";
import { periodRange, toPeriod } from "../periods.ts";
import { renderLeaderboard } from "../render/leaderboard.ts";
import type { TriviaRepo } from "../store/repo.ts";
import type { Period } from "../types.ts";
import { TRIVIA_TZ } from "../zone.ts";
import type { CommandCtx } from "./types.ts";

/** A leaderboard page as of `now`; the slash command and the page buttons both send this. */
export function leaderboardView(
  repo: TriviaRepo,
  v: { guildId: string; period: Period; page: number; viewerId: string; now: number },
) {
  const range = periodRange(v.period, dateIn(v.now, TRIVIA_TZ));
  const { from, to } = rangeInstants(range, TRIVIA_TZ);
  const list = repo.scores.standings(v.guildId, from, to);
  const page = renderLeaderboard({ range, list, page: v.page, viewerId: v.viewerId });

  return {
    content: page.content,
    components: pageButtons("trivia:page", v.period, page.page, page.pages),
    allowedMentions: { parse: [] },
  };
}

/** Public, so the server sees it; mentions never ping. */
export async function leaderboard({ i, guildId, repo }: CommandCtx): Promise<void> {
  const period = toPeriod(i.options.getString("period"));
  const page = i.options.getInteger("page") ?? 1;
  await i.reply(
    leaderboardView(repo, { guildId, period, page, viewerId: i.user.id, now: Date.now() }),
  );
}
