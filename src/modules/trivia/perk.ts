/** The one player who got a button round right while at least one other picked; else null. */
export function soleSurvivor(picks: { userId: string; right: boolean }[]): string | null {
  const right = picks.filter((p) => p.right);

  return picks.length >= 2 && right.length === 1 ? (right[0]?.userId ?? null) : null;
}
