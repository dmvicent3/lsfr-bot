import { type Dir, SIZE } from "./types.ts";

const LETTERS = "ABCDEFGHIJ";

export const rowOf = (i: number): number => Math.floor(i / SIZE);

export const colOf = (i: number): number => i % SIZE;

/** "C5" for index 42: column letter, then row number. */
export const cellName = (i: number): string => `${LETTERS[colOf(i)]}${rowOf(i) + 1}`;

export function parseCell(name: string): number | null {
  const m = /^([a-j])(\d{1,2})$/i.exec(name.trim());
  const row = Number(m?.[2]) - 1;

  if (!m?.[1] || row < 0 || row >= SIZE) return null;

  return row * SIZE + LETTERS.indexOf(m[1].toUpperCase());
}

/** The orthogonal neighbours that are on the grid. */
export function neighbours(i: number): number[] {
  const r = rowOf(i);
  const c = colOf(i);
  const steps: [number, number][] = [
    [r - 1, c],
    [r + 1, c],
    [r, c - 1],
    [r, c + 1],
  ];

  return steps
    .filter(([y, x]) => y >= 0 && y < SIZE && x >= 0 && x < SIZE)
    .map(([y, x]) => y * SIZE + x);
}

/** The cells a ship of `size` covers from `start`, or null when it runs off the grid. */
export function shipCells(start: number, size: number, dir: Dir): number[] | null {
  if (start < 0 || start >= SIZE * SIZE) return null;

  const end = (dir === "across" ? colOf(start) : rowOf(start)) + size - 1;

  if (end >= SIZE) return null;

  const step = dir === "across" ? 1 : SIZE;

  return Array.from({ length: size }, (_, n) => start + n * step);
}
