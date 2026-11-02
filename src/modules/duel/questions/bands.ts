export type Band = [number, number];

/** Ratio bands per question, hardest to closest; lower bound inclusive, upper exclusive. */
export const BANDS: readonly Band[] = [
  [3, Infinity],
  [2, 3],
  [1.5, 2],
  [1.25, 1.5],
  [1.15, 1.25],
];

/** The next easier band, or null for the first question. */
export function widen(n: number): Band | null {
  return BANDS[n - 1] ?? null;
}

export function inBand(ratio: number, band: Band): boolean {
  return ratio >= band[0] && ratio < band[1];
}
