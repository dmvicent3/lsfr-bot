import { expect, test } from "bun:test";
import { bestMatch } from "../../../../src/modules/snake/clue/match.ts";
import type { Link } from "../../../../src/modules/snake/types.ts";
import { seeded } from "../../shed/testing/random.ts";

/** Every order-preserving matching, by brute force. */
function* every(g: string, a: string, from = 0, after = -1): Generator<Link[]> {
  if (from === g.length) {
    yield [];

    return;
  }

  yield* every(g, a, from + 1, after);

  for (let j = after + 1; j < a.length; j++) {
    if (a[j] === g[from])
      for (const rest of every(g, a, from + 1, j)) yield [{ g: from, a: j }, ...rest];
  }
}

/** The rule as written, applied to a whole matching of a `g`-letter guess to an `n`-letter answer. */
const rank = (l: Link[], g: number, n: number): number[] => [
  l.length,
  l.filter((x, k) => l[k + 1]?.g === x.g + 1 && l[k + 1]?.a === x.a + 1).length,
  l.filter((x) => x.g === 0 && x.a === 0).length +
    l.filter((x) => x.g === g - 1 && x.a === n - 1).length,
  ...l.map((x) => -x.a),
  ...l.map((x) => -x.g),
];

const better = (x: number[], y: number[]): boolean => {
  const k = x.findIndex((v, i) => v !== y[i]);

  return k >= 0 && x[k]! > y[k]!;
};

function reference(g: string, a: string): Link[] {
  let best: Link[] = [];

  for (const m of every(g, a))
    if (better(rank(m, g.length, a.length), rank(best, g.length, a.length))) best = m;

  return best;
}

test("the memoised search finds the brute-force best on 3000 random pairs", () => {
  const random = seeded(11);
  const word = (n: number) =>
    Array.from({ length: n }, () => "abcde"[Math.floor(random() * 5)]).join("");

  for (let t = 0; t < 3000; t++) {
    const g = word(2 + Math.floor(random() * 7));
    const a = word(4 + Math.floor(random() * 5));
    expect(bestMatch(g, a)).toEqual(reference(g, a));
  }
});

test("no shared letters, no links", () => expect(bestMatch("dog", "cat")).toEqual([]));
