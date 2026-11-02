import { PERIODS } from "../../../core/types.ts";
import { QUESTIONS } from "../questions/bands.ts";
import type { Period, PlayerStats } from "../types.ts";

const rankText = (ranks: Record<Period, number | null>): string =>
  PERIODS.map((p) => `${p} ${ranks[p] === null ? "unranked" : `#${ranks[p]}`}`).join(" · ");

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
