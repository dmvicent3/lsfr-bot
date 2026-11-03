/** Digits placed nine times on the board (givens included), whether right or not. */
export function doneDigits(cells: string): Set<number> {
  const counts = new Map<string, number>();

  for (const c of cells) counts.set(c, (counts.get(c) ?? 0) + 1);

  return new Set([1, 2, 3, 4, 5, 6, 7, 8, 9].filter((d) => counts.get(String(d)) === 9));
}
