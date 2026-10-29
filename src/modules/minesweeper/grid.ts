export const colOf = (i: number, width: number): number => i % width;

export const rowOf = (i: number, width: number): number => Math.floor(i / width);

export const toIndex = (col: number, row: number, width: number): number => row * width + col;

/** "A" for column 0. */
export const columnLetter = (col: number): string => String.fromCharCode(65 + col);

/** The up to 8 cells touching `i`, ascending. */
export function neighbours(i: number, width: number, height: number): number[] {
  const col = colOf(i, width);
  const row = rowOf(i, width);
  const out: number[] = [];

  for (let r = Math.max(0, row - 1); r <= Math.min(height - 1, row + 1); r++) {
    for (let c = Math.max(0, col - 1); c <= Math.min(width - 1, col + 1); c++) {
      if (r !== row || c !== col) out.push(toIndex(c, r, width));
    }
  }

  return out;
}
