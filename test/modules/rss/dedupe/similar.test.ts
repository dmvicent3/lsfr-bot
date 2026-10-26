import { describe, expect, test } from "bun:test";
import { isRepeat, similarity } from "../../../../src/modules/rss/dedupe/similar.ts";

/** A unit vector whose similarity with [1, 0] is `s`. */
const at = (s: number) => Float32Array.of(s, Math.sqrt(1 - s * s));
const X = Float32Array.of(1, 0);

describe("similarity", () => {
  test("is 1 for the same vector and 0 for orthogonal ones", () => {
    expect(similarity(at(0.6), at(0.6))).toBeCloseTo(1, 6);
    expect(similarity(X, Float32Array.of(0, 1))).toBe(0);
  });

  test("is 0 for vectors of different lengths", () => {
    expect(similarity(X, Float32Array.of(1, 0, 0))).toBe(0);
  });
});

describe("isRepeat", () => {
  test("matches from 0.90", () => {
    expect(isRepeat(X, [at(0.89)])).toBe(false);
    expect(isRepeat(X, [at(0.89), at(0.91)])).toBe(true);
  });

  test("nothing recent is no repeat", () => {
    expect(isRepeat(X, [])).toBe(false);
  });
});
