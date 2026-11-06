/** A random() that returns the given values in turn, then starts over. */
export function seq(...values: number[]): () => number {
  let n = 0;

  return () => values[n++ % values.length] ?? 0;
}
