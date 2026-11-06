import { stars } from "../render/theme.ts";
import type { PullRow, Roster } from "../types.ts";

export const HISTORY_PAGE = 20;

function row(p: PullRow, roster: Roster): string {
  const name = roster.byId.get(p.driverId)?.name ?? p.driverId;
  const marks = [
    p.banner,
    `C${p.level}`,
    ...(p.featured ? ["featured"] : []),
    ...(p.refund > 0 ? [`+${p.refund} back`] : []),
  ];

  return `${stars(p.tier)} ${p.tier === 3 ? name : `**${name}**`} · ${marks.join(" · ")} · <t:${Math.floor(p.at / 1000)}:R>`;
}

/** /gacha history: one page of pulls, newest first. */
export function historyText(v: {
  rows: readonly PullRow[];
  roster: Roster;
  page: number;
  total: number;
}): string {
  if (v.total === 0) return "No pulls yet. Try `/gacha pull`.";

  const pages = Math.ceil(v.total / HISTORY_PAGE);
  const head = `**Your pulls** · ${v.total} in all · page ${v.page}/${pages}`;

  return [head, ...v.rows.map((p) => row(p, v.roster))].join("\n");
}

/** The page asked for, kept within the pages there are. */
export const clampPage = (page: number, total: number, size: number): number =>
  Math.min(Math.max(1, page), Math.max(1, Math.ceil(total / size)));
