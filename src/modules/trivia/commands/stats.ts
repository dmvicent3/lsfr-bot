import { rangeInstants } from "../../../core/periods.ts";
import { reply } from "../../../core/replies.ts";
import { dateIn } from "../../../core/zoned.ts";
import { periodRange } from "../periods.ts";
import { renderStats } from "../render/stats.ts";
import type { TriviaRepo } from "../store/repo.ts";
import type { Period } from "../types.ts";
import { TRIVIA_TZ } from "../zone.ts";
import type { CommandCtx } from "./types.ts";

function pointsIn(
  repo: TriviaRepo,
  who: { guildId: string; userId: string },
  period: Period,
  now: number,
): number {
  const { from, to } = rangeInstants(periodRange(period, dateIn(now, TRIVIA_TZ)), TRIVIA_TZ);

  return repo.scores.stats(who.guildId, who.userId, from, to).points;
}

export async function stats({ i, guildId, repo }: CommandCtx): Promise<void> {
  const userId = (i.options.getUser("member") ?? i.user).id;
  const now = Date.now();
  const who = { guildId, userId };
  const all = rangeInstants(periodRange("all", dateIn(now, TRIVIA_TZ)), TRIVIA_TZ);
  const text = renderStats({
    userId,
    points: {
      today: pointsIn(repo, who, "today", now),
      week: pointsIn(repo, who, "week", now),
      month: pointsIn(repo, who, "month", now),
      all: pointsIn(repo, who, "all", now),
    },
    all: repo.scores.stats(guildId, userId, all.from, all.to),
    buttons: repo.buttonPicks.tally(guildId, userId),
    topics: repo.topicPicks.count(guildId, userId),
  });
  await reply(i, text);
}
