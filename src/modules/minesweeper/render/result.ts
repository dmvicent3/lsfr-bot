import { dailyNumber } from "../daily/periods.ts";
import type { Award, DailyStats } from "../daily/types.ts";
import { elapsedSeconds } from "../outcome.ts";
import type { Game, Preset, Result } from "../types.ts";
import { clock } from "./clock.ts";

const LEVEL: Record<Preset, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  expert: "Expert",
};

const ENDED: Record<Result, string> = {
  won: "✅",
  lost: "❌ hit a mine after",
  "gave-up": "❌ gave up after",
};

const clicksText = (n: number): string => `${n} click${n === 1 ? "" : "s"}`;

/** "Minesweeper #3 · Expert" */
export const dailyTitle = (g: Game): string =>
  `Minesweeper #${dailyNumber(g.date ?? "")} · ${LEVEL[g.level ?? "intermediate"]}`;

/** The public, spoiler-free line for a finished daily. */
export function announceText(g: Game): string {
  const head = `💣 <@${g.playerId}> · ${dailyTitle(g)}`;
  const time = clock(elapsedSeconds(g.startedAt, g.finishedAt ?? g.startedAt ?? 0));

  if (g.result !== "won") {
    return `${head} · ${ENDED[g.result ?? "lost"]} ${clicksText(g.clicks)}`;
  }

  return `${head} · ✅ ${clicksText(g.clicks)} (3BV ${g.bbbv ?? 0}) · ${time} · +${g.points ?? 0} pts`;
}

/** Under a finished daily's grid: the points and how they add up. */
export const awardLine = (g: Game, award: Award | null): string =>
  award ? `+${award.points} pts (${award.parts.join(", ")})` : `+${g.points ?? 0} pts`;

/** The daily section of /minesweeper stats. */
export function dailyStatsLine(s: DailyStats | null): string {
  if (!s) return "Daily: none played yet.";

  const best = s.bestEfficiency === null ? "" : ` · best efficiency ${s.bestEfficiency}%`;

  return `Daily: ${s.won}/${s.played} won · ${s.points} pts · streak ${s.streak} (best ${s.bestStreak})${best}`;
}
