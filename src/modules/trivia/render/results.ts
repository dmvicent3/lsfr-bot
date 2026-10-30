import type { Standing } from "../store/types.ts";

export const num = (n: number): string => n.toLocaleString("en-US");

export const secs = (ms: number, digits: number): string => `${(ms / 1000).toFixed(digits)}s`;

const SUFFIX: Record<string, string> = { one: "st", two: "nd", few: "rd", other: "th" };
const rules = new Intl.PluralRules("en-US", { type: "ordinal" });

export const ordinal = (n: number): string => `${n}${SUFFIX[rules.select(n)] ?? "th"}`;

/** Rank shared by equal points (1 + players ahead), and the gap to the leader. */
export function rankAndGap(list: Standing[], userId: string): { rank: number; gap: number } {
  const mine = list.find((s) => s.userId === userId)?.points ?? 0;
  const top = list[0]?.points ?? mine;

  return { rank: 1 + list.filter((s) => s.points > mine).length, gap: top - mine };
}

export interface Win {
  name: string;
  answer: string;
  points: number;
  ms: number;
  rank: number;
  gap: number;
  totals: { today: number; week: number; month: number };
}

export function winnerLine(w: Win): string {
  const place = w.rank === 1 ? "leader" : `${ordinal(w.rank)}, ${num(w.gap)} pts behind leader`;
  const t = w.totals;
  const totals = `${num(t.today)} today | ${num(t.week)} week | ${num(t.month)} month`;

  return `**${w.name}** got it! The answer was: **${w.answer}**. +${w.points} pts in ${secs(w.ms, 2)} (${place}) (${totals})`;
}

export function recordLine(r: {
  ms: number;
  previous: { ms: number; name: string } | null;
  improved: boolean;
}): string {
  if (!r.previous) return `First answer on record: ${secs(r.ms, 2)}`;

  if (r.improved)
    return `New record! ${secs(r.ms, 2)} (was ${secs(r.previous.ms, 2)} by ${r.previous.name})`;

  return `Record: ${secs(r.previous.ms, 2)} by ${r.previous.name}`;
}

export function buttonResults(
  awards: { name: string; points: number; ms: number }[],
  answer: string,
): string {
  if (awards.length === 0) return `Nobody got it — the answer was **${answer}**.`;

  const list = awards.map((a) => `${a.name} +${a.points} (${secs(a.ms, 1)})`).join(", ");

  return `✅ ${list} — the answer was **${answer}**`;
}

export const perkLine = (name: string): string =>
  `🎯 ${name} was the only one right — they choose the next topic`;

export const claimLine = (name: string, item: string, points: number): string =>
  `✔ ${name}: ${item} +${points}`;
