import { rankText } from "../../../core/leaderboard-page.ts";
import { LEVELS, type Level, type Period, type PlayerStats } from "../types.ts";
import { formatDuration } from "./duration.ts";

const perLevel = (label: string, f: (l: Level) => string): string =>
  `${label}: ${LEVELS.map((l) => `${l} ${f(l)}`).join(" · ")}`;

const time = (ms: number | null): string => (ms === null ? "—" : formatDuration(ms));

export function renderStats(
  name: string,
  s: PlayerStats,
  ranks: Record<Period, number | null>,
): string {
  return [
    `## 🔢 Sudoku stats — ${name}`,
    `**${s.points} points**`,
    perLevel("Solved", (l) => `${s.solved[l]}`),
    perLevel("Best", (l) => time(s.bestMs[l])),
    perLevel("Average", (l) => time(s.avgMs[l])),
    `Streak ${s.currentStreak} · best ${s.longestStreak}`,
    rankText(ranks),
  ].join("\n");
}
