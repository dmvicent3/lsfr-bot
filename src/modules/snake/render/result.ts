import type { Game } from "../types.ts";
import type { BoardView } from "./types.ts";

/** `1 guess`, `4 guesses`. */
export const guessCount = (n: number): string => `${n} ${n === 1 ? "guess" : "guesses"}`;

const reveal = (answer: string): string => `the word was **${answer.toUpperCase()}**`;

/** The public line for a finished daily; it never gives the word away. */
export function resultLine(number: number, g: Game): string {
  const name = `Snake #${number}`;

  if (!g.solved) return `<@${g.userId}> gave up on ${name} after ${guessCount(g.guesses.length)}`;

  return `<@${g.userId}> solved ${name} in ${guessCount(g.guesses.length)} — ${g.points ?? 0} pts`;
}

function dailyLines(v: BoardView): string[] {
  if (!v.solved) return [`Gave up — 0 points, ${reveal(v.answer)}`];

  return [...(v.award?.parts ?? []), `**${v.award?.points ?? 0} points**`];
}

const practiceLines = (v: BoardView): string[] => [
  v.solved ? `Solved in ${guessCount(v.guesses.length)}!` : `Gave up — ${reveal(v.answer)}`,
];

/** What follows the board once finished: the outcome, and for a daily the time to the next. */
export function resultLines(v: BoardView): string[] {
  if (!v.finished) return [];

  const next = v.number !== null && v.untilNext ? ["", `Next snake in ${v.untilNext}`] : [];

  return [...(v.number === null ? practiceLines(v) : dailyLines(v)), ...next];
}
