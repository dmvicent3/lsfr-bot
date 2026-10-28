import { rankOf } from "../ranking.ts";
import type { DateRange, LeaderboardPage, Period, Standing } from "../types.ts";

export const PAGE_SIZE = 10;

const pct = (s: Standing): number => Math.round((s.wins / s.games) * 100);

const row = (s: Standing, rank: number): string =>
  `**${rank}.** <@${s.userId}> — ${s.points} pts · ${s.wins} W · ${pct(s)}%`;

function footer(list: Standing[], viewerId: string): string {
  const rank = rankOf(list, viewerId);
  const mine = rank === null ? undefined : list[rank - 1];

  return mine ? `You: #${rank} · ${mine.points} pts` : "You haven't played this period.";
}

/** One page of the period's standings; the page is clamped to the ones there are. */
export function renderLeaderboard(v: {
  period: Period;
  range: DateRange;
  list: Standing[];
  page: number;
  viewerId: string;
}): LeaderboardPage {
  const heading = `## 🟩 Word — ${v.range.label}`;
  const pages = Math.max(1, Math.ceil(v.list.length / PAGE_SIZE));
  const page = Math.min(Math.max(1, v.page), pages);

  if (v.list.length === 0) {
    return { content: `${heading}\nNo games yet. Play with \`/word guess\`.`, page, pages };
  }

  const start = (page - 1) * PAGE_SIZE;
  const rows = v.list.slice(start, start + PAGE_SIZE).map((s, i) => row(s, start + i + 1));
  const pageLine = pages > 1 ? [`Page ${page}/${pages}`] : [];
  const content = [heading, ...rows, "", footer(v.list, v.viewerId), ...pageLine].join("\n");

  return { content, page, pages };
}
