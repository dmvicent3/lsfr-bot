import { rankText } from "../../../core/leaderboard-page.ts";
import { QUESTIONS } from "../questions/bands.ts";
import type { Period, PlayerStats } from "../types.ts";

export function renderStats(
  name: string,
  s: PlayerStats,
  ranks: Record<Period, number | null>,
): string {
  const avg = s.avgCorrect === null ? "—" : `${Math.round(s.avgCorrect * 10) / 10}/${QUESTIONS}`;

  return [
    `## 📊 Stat duel — ${name}`,
    `**${s.points} points**`,
    `Days played ${s.days} · average ${avg} · perfect ${s.perfect}`,
    `Streak ${s.currentStreak} · best ${s.longestStreak}`,
    rankText(ranks),
  ].join("\n");
}
