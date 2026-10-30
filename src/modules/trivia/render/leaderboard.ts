import type { DateRange } from "../../../core/types.ts";
import type { Standing } from "../store/types.ts";
import { num, rankAndGap } from "./results.ts";

export const PAGE_SIZE = 10;

const row = (list: Standing[], s: Standing): string =>
  `**${rankAndGap(list, s.userId).rank}.** <@${s.userId}> — ${num(s.points)} pts`;

function footer(list: Standing[], viewerId: string): string {
  const mine = list.find((s) => s.userId === viewerId);
  /** Named, not "You": the message is public and follows whoever asked or paged last. */
  const who = `<@${viewerId}>`;

  if (!mine) return `${who} has no points this period.`;

  return `${who}: #${rankAndGap(list, viewerId).rank} · ${num(mine.points)} pts`;
}

/** One page of a period's standings; the page is clamped to the ones there are. */
export function renderLeaderboard(v: {
  range: DateRange;
  list: Standing[];
  page: number;
  viewerId: string;
}): { content: string; page: number; pages: number } {
  const heading = `## 🧠 Trivia — ${v.range.label}`;
  const pages = Math.max(1, Math.ceil(v.list.length / PAGE_SIZE));
  const page = Math.min(Math.max(1, v.page), pages);

  if (v.list.length === 0) {
    return { content: `${heading}\nNo points yet. Start with \`/trivia start\`.`, page, pages };
  }

  const start = (page - 1) * PAGE_SIZE;
  const rows = v.list.slice(start, start + PAGE_SIZE).map((s) => row(v.list, s));
  const pageLine = pages > 1 ? [`Page ${page}/${pages}`] : [];
  const content = [heading, ...rows, "", footer(v.list, v.viewerId), ...pageLine].join("\n");

  return { content, page, pages };
}
