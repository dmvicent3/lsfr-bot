import { clock } from "./labels.ts";
import type { Game } from "../types.ts";
import type { BoardView } from "./types.ts";

/** The announcement for a finished daily. */
export function resultLine(number: number, g: Game): string {
  if (!g.solved) return `<@${g.userId}> gave up on Crossword #${number}`;

  const time = clock((g.finishedAt ?? g.startedAt) - g.startedAt);
  const parts = [`${g.points ?? 0} pts`, `${g.wrong} wrong checks`, `${g.reveals} reveals`, time];

  return `<@${g.userId}> solved Crossword #${number} — ${parts.join(" · ")}`;
}

function dailyLines(v: BoardView): string[] {
  if (!v.solved) return ["Gave up — 0 points"];

  return [...(v.award?.parts ?? []), `**${v.award?.points ?? v.points} points**`];
}

const practiceLines = (v: BoardView): string[] => [
  v.solved ? "Solved!" : "Gave up",
  `Wrong checks: ${v.wrong} · Reveals: ${v.reveals}`,
];

/** What follows the board once finished: the award parts, and for a daily the time to the next. */
export function resultLines(v: BoardView): string[] {
  if (!v.finished) return [];

  const next = v.number !== null && v.untilNext ? ["", `Next crossword in ${v.untilNext}`] : [];

  return [...(v.number === null ? practiceLines(v) : dailyLines(v)), ...next];
}
