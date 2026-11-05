import { rankText } from "../../../core/leaderboard-page.ts";
import type { Period, PlayerStats } from "../ranking-types.ts";

export function renderStats(
  name: string,
  s: PlayerStats,
  ranks: Record<Period, number | null>,
): string {
  const avg = s.avgGuesses === null ? "—" : `${Math.round(s.avgGuesses * 10) / 10}`;

  return [
    `## 🐍 Snake — ${name}`,
    `**${s.points} points**`,
    `Days played ${s.days} · solved ${s.solved} · average guesses ${avg} · best ${s.best ?? "—"}`,
    `Streak ${s.currentStreak} · best ${s.longestStreak}`,
    rankText(ranks),
  ].join("\n");
}
