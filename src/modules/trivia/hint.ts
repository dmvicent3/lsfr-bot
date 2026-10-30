import { shuffle } from "./shuffle.ts";

const isHidden = (c: string): boolean => /[\p{L}\p{N}]/u.test(c);

/** The order letters get revealed in: each word's first letter, then the rest shuffled. */
export function revealOrder(answer: string, random: () => number): number[] {
  const chars = Array.from(answer);
  const hidden = chars.flatMap((c, i) => (isHidden(c) ? [i] : []));
  const firsts = hidden.filter((i) => i === 0 || !isHidden(chars[i - 1] ?? " "));
  const rest = hidden.filter((i) => !firsts.includes(i));

  return [...firsts, ...shuffle(rest, random)];
}

const REVEALED: Record<0 | 1 | 2, (n: number) => number> = {
  0: () => 0,
  1: (n) => Math.ceil(n / 3),
  2: (n) => Math.ceil((2 * n) / 3),
};

/** The answer with unrevealed letters and digits as `*`; spaces and punctuation always show. */
export function mask(answer: string, order: number[], level: 0 | 1 | 2): string {
  const open = new Set(order.slice(0, REVEALED[level](order.length)));

  return Array.from(answer)
    .map((c, i) => (isHidden(c) && !open.has(i) ? "*" : c))
    .join("");
}
