import type { DateRange } from "../../../core/types.ts";
import type { ShedStats } from "../store/places.ts";
import { TITLE } from "./parts.ts";

export const PAGE_SIZE = 10;

interface Paged {
  content: string;
  page: number;
  pages: number;
}

function paged<T>(items: T[], want: number, line: (t: T, i: number) => string): Paged {
  const pages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const page = Math.min(Math.max(1, want), pages);
  const start = (page - 1) * PAGE_SIZE;
  const rows = items.slice(start, start + PAGE_SIZE).map((t, i) => line(t, start + i));
  const pageLine = pages > 1 ? [`Page ${page}/${pages}`] : [];

  return { content: [...rows, ...pageLine].join("\n"), page, pages };
}

/** Points in a period; the viewer named at the bottom (the message is public). */
export function renderLeaderboard(v: {
  range: DateRange;
  list: { userId: string; points: number }[];
  page: number;
  viewerId: string;
}): Paged {
  const heading = `## ${TITLE} — ${v.range.label}`;

  if (v.list.length === 0)
    return {
      content: `${heading}\nNo games finished yet. Start with \`/shed new\`.`,
      page: 1,
      pages: 1,
    };

  const body = paged(v.list, v.page, (s, i) => `**${i + 1}.** <@${s.userId}> — ${s.points} pts`);
  const rank = v.list.findIndex((s) => s.userId === v.viewerId);
  const mine =
    rank < 0 ? `<@${v.viewerId}> has no points this period.` : `<@${v.viewerId}>: #${rank + 1}`;

  return { ...body, content: `${heading}\n${body.content}\n\n${mine}` };
}

export function renderStats(userId: string, s: ShedStats): string {
  const average = s.averagePlace === null ? "—" : s.averagePlace.toFixed(1);

  return [
    `## ${TITLE} — stats for <@${userId}>`,
    `Games: **${s.games}** · wins: **${s.wins}** · average place: **${average}** · points: **${s.points}**`,
  ].join("\n");
}
