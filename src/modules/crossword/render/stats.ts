import { rankText } from "../../../core/leaderboard-page.ts";
import type { Period, PlayerStats } from "../ranking-types.ts";

export function renderStats(
  name: string,
  s: PlayerStats,
  ranks: Record<Period, number | null>,
): string {
  const avg = s.avgWrongChecks === null ? "—" : `${Math.round(s.avgWrongChecks * 10) / 10}`;

  return [
    `## 📰 Crossword — ${name}`,
    `**${s.points} points**`,
    `Days played ${s.days} · solved ${s.solved} · average wrong checks ${avg}`,
    `Streak ${s.currentStreak} · best ${s.longestStreak}`,
    rankText(ranks),
  ].join("\n");
}
