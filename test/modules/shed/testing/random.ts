/** A repeatable random() for tests (a small linear congruential generator). */
export function seeded(seed: number): () => number {
  let s = seed >>> 0;

  return () => {
    s = (Math.imul(s, 1_664_525) + 1_013_904_223) >>> 0;

    return s / 4_294_967_296;
  };
}
