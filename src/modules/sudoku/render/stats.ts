import type { Level, Period, PlayerStats } from "../types.ts";
import { formatDuration } from "./duration.ts";

const LEVELS: Level[] = ["easy", "medium", "hard"];
const PERIODS: Period[] = ["today", "week", "month", "all"];

const perLevel = (label: string, f: (l: Level) => string): string =>
  `${label}: ${LEVELS.map((l) => `${l} ${f(l)}`).join(" · ")}`;

const time = (ms: number | null): string => (ms === null ? "—" : formatDuration(ms));

const rankText = (ranks: Record<Period, number | null>): string =>
  PERIODS.map((p) => `${p} ${ranks[p] === null ? "unranked" : `#${ranks[p]}`}`).join(" · ");

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
