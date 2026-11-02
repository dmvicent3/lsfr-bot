import type { Database } from "bun:sqlite";
import { pageButtons } from "../../../core/page-buttons.ts";
import { dateIn } from "../../../core/zoned.ts";
import { periodRange } from "../periods.ts";
import { standings } from "../ranking.ts";
import { renderLeaderboard } from "../render/leaderboard.ts";
import { sudokuTimeZone } from "../settings.ts";
import type { SudokuRepo } from "../store/repo.ts";
import type { Period } from "../types.ts";

const PERIODS: readonly string[] = ["today", "week", "month", "all"] satisfies Period[];

const isPeriod = (s: string): s is Period => PERIODS.includes(s);

export const toPeriod = (s: string | null | undefined): Period => (s && isPeriod(s) ? s : "today");

/** A leaderboard page as of `now`; the slash command and the page buttons both send this. */
export function leaderboardView(
  db: Database,
  repo: SudokuRepo,
  v: { guildId: string; period: Period; page: number; viewerId: string; now: number },
) {
  const today = dateIn(v.now, sudokuTimeZone(db, v.guildId));
  const range = periodRange(v.period, today);
  const list = standings(repo.games.solvedIn(v.guildId, range));
  const page = renderLeaderboard({ ...v, range, list });

  return {
    content: page.content,
    components: pageButtons("sudoku:page", v.period, page.page, page.pages),
    allowedMentions: { parse: [] as [] },
  };
}
