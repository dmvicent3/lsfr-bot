import { rankText } from "../../../core/leaderboard-page.ts";
import type { Period, PlayerStats } from "../ranking-types.ts";
import { CELLS } from "../scoring.ts";

export function renderStats(
  name: string,
  s: PlayerStats,
  ranks: Record<Period, number | null>,
): string {
  const avg = s.avgFilled === null ? "—" : `${Math.round(s.avgFilled * 10) / 10}/${CELLS} cells`;

  return [
    `## 🗺️ Country grid — ${name}`,
    `**${s.points} points**`,
    `Days played ${s.days} · average ${avg} · perfect ${s.perfect}`,
    `Streak ${s.currentStreak} · best ${s.longestStreak}`,
    rankText(ranks),
  ].join("\n");
}
