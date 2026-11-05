import type { Link, MatchState as State } from "../types.ts";

/** The link before `links[k]`: the one before it in the list, or the state's own for the first. */
function previous(links: Link[], k: number, s: State): Link | undefined {
  if (k > 0) return links[k - 1];

  return s.joined ? { g: s.from - 1, a: s.after } : undefined;
}

/** Neighbouring guess letters on neighbouring answer letters, the link before `links` included. */
const pairsOf = (links: Link[], s: State): number =>
  links.filter((l, k) => {
    const prev = previous(links, k, s);

    return prev !== undefined && l.g === prev.g + 1 && l.a === prev.a + 1;
  }).length;

/** How many of the answer's first and last letters are matched. */
const capsOf = (links: Link[], length: number): number =>
  new Set(links.flatMap((l) => (l.a === 0 || l.a === length - 1 ? [l.a] : []))).size;

/**
 * A matching's rank, compared item by item, higher first: matched letters, joined pairs, ends
 * matched, then the earliest guess letters, then the earliest answer letters. Every term adds up
 * over a split, so the best whole is the best first link plus the best rest.
 */
const rankOf = (links: Link[], s: State, length: number): number[] => [
  links.length,
  pairsOf(links, s),
  capsOf(links, length),
  ...links.map((l) => -l.g),
  ...links.map((l) => -l.a),
];

/** Positive when `x` ranks above `y`. */
function compare(x: number[], y: number[]): number {
  for (const [k, v] of x.entries()) {
    const d = v - (y[k] ?? 0);

    if (d !== 0) return d;
  }

  return x.length - y.length;
}

/**
 * The best matching of `guess` letters to `answer` letters, in guess order: equal letters,
 * increasing in both words. A memoised search over (guess letter, answer letter, joined).
 */
export function bestMatch(guess: string, answer: string): Link[] {
  const memo = new Map<string, Link[]>();

  function best(s: State): Link[] {
    const key = `${s.from}:${s.after}:${s.joined}`;
    const known = memo.get(key);

    if (known) return known;

    let top =
      s.from < guess.length ? best({ from: s.from + 1, after: s.after, joined: false }) : [];

    for (let a = s.after + 1; s.from < guess.length && a < answer.length; a++) {
      if (answer[a] !== guess[s.from]) continue;

      const links = [{ g: s.from, a }, ...best({ from: s.from + 1, after: a, joined: true })];

      if (compare(rankOf(links, s, answer.length), rankOf(top, s, answer.length)) > 0) top = links;
    }

    memo.set(key, top);

    return top;
  }

  return best({ from: 0, after: -1, joined: false });
}
