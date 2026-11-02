import { rankOf } from "./daily.ts";

export const PAGE_SIZE = 10;

export interface LeaderboardPage {
  content: string;
  page: number;
  pages: number;
}

interface Ranked {
  userId: string;
  points: number;
}

function footer(list: Ranked[], viewerId: string): string {
  const rank = rankOf(list, viewerId);
  const mine = rank === null ? undefined : list[rank - 1];

  /** Named, not "You": the message is public and follows whoever asked or paged last. */
  const who = `<@${viewerId}>`;

  return mine ? `${who}: #${rank} · ${mine.points} pts` : `${who} hasn't played this period.`;
}

/** One page of a ranked list under a heading; the page is clamped to the ones there are. */
export function leaderboardPage<T extends Ranked>(v: {
  heading: string;
  empty: string;
  list: T[];
  page: number;
  viewerId: string;
  row: (s: T, rank: number) => string;
}): LeaderboardPage {
  const pages = Math.max(1, Math.ceil(v.list.length / PAGE_SIZE));
  const page = Math.min(Math.max(1, v.page), pages);

  if (v.list.length === 0) return { content: `${v.heading}\n${v.empty}`, page, pages };

  const start = (page - 1) * PAGE_SIZE;
  const rows = v.list.slice(start, start + PAGE_SIZE).map((s, i) => v.row(s, start + i + 1));
  const pageLine = pages > 1 ? [`Page ${page}/${pages}`] : [];
  const content = [v.heading, ...rows, "", footer(v.list, v.viewerId), ...pageLine].join("\n");

  return { content, page, pages };
}
