import { emptySquares } from "./board.ts";
import type { Board, JevosPick } from "./types.ts";

/** Squares scoring at least this part of the top P(yes) are equally likely, so games vary. */
const CLOSE = 0.8;

/** jevos's square from its P(yes) per square number (keys "1"–"9"). */
export function pick(answers: Map<string, number>, random: () => number): JevosPick {
  const entries = [...answers].toSorted(([a], [b]) => Number(a) - Number(b));
  const top = Math.max(...entries.map(([, p]) => p));
  const close = entries.filter(([, p]) => p >= top * CLOSE);
  const [key, p] = close[Math.floor(random() * close.length)] ?? entries[0]!;
  const sum = entries.reduce((total, [, q]) => total + q, 0);

  return { square: Number(key) - 1, share: sum > 0 ? p / sum : 1 / entries.length };
}

/** A random empty square, for when jev cannot answer. */
export function guess(board: Board, random: () => number): JevosPick {
  const free = emptySquares(board);

  return { square: free[Math.floor(random() * free.length)] ?? 0, share: null };
}
