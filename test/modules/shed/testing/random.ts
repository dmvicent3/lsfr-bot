import { lcg } from "../../../../src/core/random.ts";

/** A repeatable random() for tests. */
export function seeded(seed: number): () => number {
  return lcg(seed);
}
