import type { Period, PlayerStats } from "../types.ts";

const BAR = 10;

export type Ranks = Record<Period, { rank: number; of: number } | null>;

const PERIODS: Period[] = ["today", "week", "month", "all"];

/** Wins per attempt count, bars scaled to the biggest, one block at least when not zero. */
function bars(distribution: number[]): string[] {
  const max = Math.max(1, ...distribution);

  return distribution.map((n, i) => {
    const blocks = n === 0 ? 0 : Math.max(1, Math.round((n / max) * BAR));

    return `\`${i + 1}\` ${"█".repeat(blocks)} ${n}`;
  });
}

const rankText = (ranks: Ranks): string =>
  PERIODS.map((p) => {
    const r = ranks[p];

    return `${p} ${r ? `#${r.rank} of ${r.of}` : "unranked"}`;
  }).join(" · ");

export function renderStats(v: { userId: string; stats: PlayerStats; ranks: Ranks }): string {
  const s = v.stats;
  const rate = s.winRate === null ? "–" : `${Math.round(s.winRate * 100)}%`;
  const perWin = s.avgAttempts === null ? "per win –" : `${s.avgAttempts.toFixed(1)} per win`;

  return [
    `## 🟩 Word stats — <@${v.userId}>`,
    `**${s.points} points** · ${s.wins} W · ${s.losses} L · ${rate}`,
    `Streak ${s.currentStreak} · best ${s.longestStreak}`,
    `${s.totalGuesses} guesses · ${perWin}`,
    ...bars(s.distribution),
    rankText(v.ranks),
  ].join("\n");
}
