import type { JevosPick } from "./types.ts";

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

/** A random candidate square, for when jev cannot answer. */
export const guess = (squares: number[], random: () => number): JevosPick => ({
  square: squares[Math.floor(random() * squares.length)] ?? 0,
  share: null,
});
