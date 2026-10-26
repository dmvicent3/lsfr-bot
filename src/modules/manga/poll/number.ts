/** A chapter number as a number ("10.5" → 10.5); null when absent or not a number. */
export function chapterNumber(raw: string | null): number | null {
  if (raw === null || raw.trim() === "") return null;

  const n = Number(raw);

  return Number.isFinite(n) ? n : null;
}
