/** A Fisher-Yates shuffled copy. */
export function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const out = [...items];

  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const [a, b] = [out[i], out[j]];

    if (a === undefined || b === undefined) continue;

    out[i] = b;
    out[j] = a;
  }

  return out;
}
