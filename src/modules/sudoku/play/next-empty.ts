/** The next `0` after `from`, wrapping past the end; `from` when there is none. */
export function nextEmpty(cells: string, from: number): number {
  const n = cells.length;

  for (let step = 1; step <= n; step++) {
    const i = (from + step) % n;

    if (cells[i] === "0") return i;
  }

  return from;
}
