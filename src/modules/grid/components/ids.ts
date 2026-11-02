/** A cell number 0..8 from a custom ID part; null when it is not one. */
export function cellIndex(part: string | undefined): number | null {
  const n = Number(part);

  return part !== undefined && Number.isInteger(n) && n >= 0 && n < 9 ? n : null;
}
