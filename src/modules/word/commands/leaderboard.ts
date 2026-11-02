import type { Database } from "bun:sqlite";
import { PERIODS } from "../../../core/types.ts";
import { dateIn } from "../../../core/zoned.ts";
import { periodStandings } from "../play/standings.ts";
import { renderLeaderboard } from "../render/leaderboard.ts";
import { pageButtons } from "../../../core/page-buttons.ts";
import { wordSettings } from "../settings.ts";
import type { WordRepo } from "../store/repo.ts";
import type { Period } from "../types.ts";
import type { CommandCtx } from "./types.ts";

/** A leaderboard page as of `now`; the slash command and the page buttons both send this. */
export function leaderboardView(
  db: Database,
  repo: WordRepo,
  v: { guildId: string; period: Period; page: number; viewerId: string; now: number },
) {
  const today = dateIn(v.now, wordSettings(db, v.guildId).timeZone);
  const { range, list } = periodStandings(repo, v.guildId, v.period, today);
  const page = renderLeaderboard({ ...v, range, list });

  return {
    content: page.content,
    components: pageButtons("word:page", v.period, page.page, page.pages),
    allowedMentions: { parse: [] },
  };
}

export const toPeriod = (s: string | null | undefined): Period =>
  PERIODS.find((p) => p === s) ?? "today";

/** Public, so the server sees it; mentions never ping. */
export async function leaderboard({ i, guildId, db, repo }: CommandCtx): Promise<void> {
  const period = toPeriod(i.options.getString("period"));
  const page = i.options.getInteger("page") ?? 1;
  const view = { guildId, period, page, viewerId: i.user.id, now: Date.now() };
  await i.reply(leaderboardView(db, repo, view));
}
