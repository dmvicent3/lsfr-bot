import type { DateRange } from "../../../core/types.ts";
import type { LevelStats, Standing } from "../store/types.ts";
import type { Difficulty } from "../types.ts";
import { TITLE } from "./board.ts";

export const PAGE_SIZE = 10;

interface Paged {
  content: string;
  page: number;
  pages: number;
}

const LEVELS: [Difficulty, string][] = [
  ["easy", "Easy"],
  ["normal", "Normal"],
  ["hard", "Hard"],
];

/** Points in a period; the viewer named at the bottom (the message is public). */
export function renderLeaderboard(v: {
  range: DateRange;
  list: Standing[];
  page: number;
  viewerId: string;
}): Paged {
  const heading = `## ${TITLE} — ${v.range.label}`;

  if (v.list.length === 0) {
    return { content: `${heading}\nNo wins yet. Start with \`/four play\`.`, page: 1, pages: 1 };
  }

  const pages = Math.ceil(v.list.length / PAGE_SIZE);
  const page = Math.min(Math.max(1, v.page), pages);
  const start = (page - 1) * PAGE_SIZE;
  const rows = v.list
    .slice(start, start + PAGE_SIZE)
    .map((s, i) => `**${start + i + 1}.** <@${s.userId}> — ${s.points} pts (${s.wins} wins)`);
  const pageLine = pages > 1 ? [`Page ${page}/${pages}`] : [];
  const rank = v.list.findIndex((s) => s.userId === v.viewerId);
  const mine =
    rank < 0 ? `<@${v.viewerId}> has no wins this period.` : `<@${v.viewerId}>: #${rank + 1}`;

  return { content: [heading, ...rows, ...pageLine, "", mine].join("\n"), page, pages };
}

const best = (s: LevelStats): string => (s.best === null ? "—" : `${s.best} moves`);

export function renderStats(userId: string, stats: Record<Difficulty, LevelStats>): string {
  const lines = LEVELS.map(([level, name]) => {
    const s = stats[level];

    return `${name}: **${s.wins}** W · **${s.losses}** L · **${s.draws}** D · best win: ${best(s)}`;
  });

  return [`## ${TITLE} — stats for <@${userId}>`, ...lines].join("\n");
}
