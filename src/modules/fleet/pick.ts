import { parseCell } from "./grid.ts";

/** Cells scoring at least this part of the top P(yes) are equally likely, so games vary. */
const CLOSE = 0.8;

/** jevos's cell from its P(yes) per cell name; null when no answer names a candidate. */
export function pick(
  answers: Map<string, number>,
  cells: number[],
  random: () => number,
): number | null {
  const scored = [...answers]
    .map(([key, p]) => ({ cell: parseCell(key), p }))
    .filter((a): a is { cell: number; p: number } => a.cell !== null && cells.includes(a.cell))
    .toSorted((a, b) => a.cell - b.cell);

  if (scored.length === 0) return null;

  const top = Math.max(...scored.map((a) => a.p));
  const close = scored.filter((a) => a.p >= top * CLOSE);

  return (close[Math.floor(random() * close.length)] ?? scored[0])?.cell ?? null;
}

/** A random candidate, for when jev cannot answer. */
export const guess = (cells: number[], random: () => number): number =>
  cells[Math.floor(random() * cells.length)] ?? 0;
