import type { Grid } from "../types.ts";

const SIZE = 9;
const CELLS = 81;
const ALL = 0b111111111;

export function parseGrid(s: string): Grid {
  return Array.from(s, Number);
}

export function gridText(g: Grid): string {
  return g.join("");
}

const row = (c: number) => Math.floor(c / SIZE);
const col = (c: number) => c % SIZE;
const box = (c: number) => Math.floor(row(c) / 3) * 3 + Math.floor(col(c) / 3);

function cellsWhere(match: (c: number) => boolean): number[] {
  return Array.from({ length: CELLS }, (_, c) => c).filter(match);
}

export const UNITS: readonly (readonly number[])[] = [
  ...Array.from({ length: SIZE }, (_, i) => cellsWhere((c) => row(c) === i)),
  ...Array.from({ length: SIZE }, (_, i) => cellsWhere((c) => col(c) === i)),
  ...Array.from({ length: SIZE }, (_, i) => cellsWhere((c) => box(c) === i)),
];

export const PEERS: readonly (readonly number[])[] = Array.from({ length: CELLS }, (_, c) =>
  cellsWhere((o) => o !== c && (row(o) === row(c) || col(o) === col(c) || box(o) === box(c))),
);

/** 9-bit mask of the digits still allowed in a cell; bit d-1 set = d allowed. */
export function candidates(g: Grid, cell: number): number {
  let mask = ALL;

  for (const p of PEERS[cell]!) {
    const d = g[p]!;

    if (d !== 0) mask &= ~(1 << (d - 1));
  }

  return mask;
}
