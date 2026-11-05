import { rankText } from "../../../core/leaderboard-page.ts";
import type { Period, PlayerStats } from "../ranking-types.ts";

export function renderStats(
  name: string,
  s: PlayerStats,
  ranks: Record<Period, number | null>,
): string {
  const avg = s.avgMistakes === null ? "—" : `${Math.round(s.avgMistakes * 10) / 10}`;

  return [
    `## 🧩 Groups — ${name}`,
    `**${s.points} points**`,
    `Days played ${s.days} · solved ${s.solved} · perfect ${s.perfect} · average mistakes ${avg}`,
    `Streak ${s.currentStreak} · best ${s.longestStreak}`,
    rankText(ranks),
  ].join("\n");
}
