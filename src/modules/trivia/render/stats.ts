import type { PlayerStats } from "../store/types.ts";
import { num, secs } from "./results.ts";

export interface StatsView {
  userId: string;
  points: { today: number; week: number; month: number; all: number };
  all: PlayerStats;
  buttons: { right: number; played: number };
  topics: number;
}

function typedLine(s: PlayerStats): string {
  const base = `Typed answers won: ${num(s.typedWins)}`;

  if (s.avgTypedMs === null || s.bestTypedMs === null) return base;

  return `${base} (average ${secs(s.avgTypedMs, 1)}, best ${secs(s.bestTypedMs, 2)})`;
}

export function renderStats(v: StatsView): string {
  const p = v.points;

  return [
    `## 🧠 Trivia stats — <@${v.userId}>`,
    `Points: ${num(p.today)} today · ${num(p.week)} week · ${num(p.month)} month · ${num(p.all)} all time`,
    typedLine(v.all),
    `Button rounds: ${num(v.buttons.right)} right of ${num(v.buttons.played)}`,
    `KAOS items: ${num(v.all.kaosItems)}`,
    `Topics picked: ${num(v.topics)}`,
  ].join("\n");
}
