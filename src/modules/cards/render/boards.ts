import { escapeMarkdown } from "discord.js";
import type { DateRange } from "../../../core/types.ts";
import type { CustomCard } from "../store/custom.ts";
import type { CardStats } from "../store/wins.ts";
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

/** Round wins in a period; the viewer named at the bottom (the message is public). */
export function renderLeaderboard(v: {
  range: DateRange;
  list: { userId: string; wins: number }[];
  page: number;
  viewerId: string;
}): Paged {
  const heading = `## ${TITLE} — ${v.range.label}`;

  if (v.list.length === 0)
    return {
      content: `${heading}\nNo round wins yet. Start with \`/cards start\`.`,
      page: 1,
      pages: 1,
    };

  const body = paged(v.list, v.page, (s, i) => `**${i + 1}.** <@${s.userId}> — ${s.wins} wins`);
  const rank = v.list.findIndex((s) => s.userId === v.viewerId);
  const mine =
    rank < 0 ? `<@${v.viewerId}> has no wins this period.` : `<@${v.viewerId}>: #${rank + 1}`;

  return { ...body, content: `${heading}\n${body.content}\n\n${mine}` };
}

/** The server's cards, newest first. */
export function renderList(cards: CustomCard[], page: number, mine: boolean): Paged {
  const heading = `## ${TITLE} — ${mine ? "your" : "server"} cards`;

  if (cards.length === 0)
    return { content: `${heading}\nNo cards yet. Add one with \`/cards add\`.`, page: 1, pages: 1 };

  const body = paged(
    cards,
    page,
    (c) => `\`#${c.id}\` ${c.kind} · ${escapeMarkdown(c.text)} · <@${c.addedBy}>`,
  );

  return { ...body, content: `${heading}\n${body.content}` };
}

export function renderStats(userId: string, s: CardStats): string {
  const best = s.best ? `\nBest card (${s.best.votes} votes): ${s.best.prompt}` : "";

  return [
    `## ${TITLE} — stats for <@${userId}>`,
    `Games: **${s.games}** · games won: **${s.gamesWon}** · rounds won: **${s.roundsWon}**${best}`,
  ].join("\n");
}
