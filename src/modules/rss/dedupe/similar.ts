/** Two titles this similar are the same story (picked on 2026-10-24..26 posts). */
export const REPEAT_AT = 0.9;

/** Cosine similarity of two normalized vectors; 0 when their lengths differ (another model). */
export function similarity(a: Float32Array, b: Float32Array): number {
  if (a.length !== b.length) return 0;

  let dot = 0;

  for (let i = 0; i < a.length; i++) dot += (a[i] ?? 0) * (b[i] ?? 0);

  return dot;
}

export function isRepeat(vector: Float32Array, recent: Float32Array[]): boolean {
  return recent.some((r) => similarity(vector, r) >= REPEAT_AT);
}
