import type { Link, Tile } from "../types.ts";
import { bestMatch } from "./match.ts";

/** The answer's unmatched letters and how many of each are left. */
function leftOver(answer: string, links: Link[]): Map<string, number> {
  const used = new Set(links.map((l) => l.a));
  const left = new Map<string, number>();

  for (const [a, ch] of answer.split("").entries()) {
    if (!used.has(a)) left.set(ch, (left.get(ch) ?? 0) + 1);
  }

  return left;
}

const green = (letter: string, a: number, next: number | undefined, length: number): Tile => ({
  letter,
  colour: "green",
  joinNext: next === a + 1,
  capStart: a === 0,
  capEnd: a === length - 1,
});

const loose = (letter: string, yellow: boolean): Tile => ({
  letter,
  colour: yellow ? "yellow" : "dark",
  joinNext: false,
  capStart: false,
  capEnd: false,
});

/**
 * The tiles for `guess` against `answer`: the best matching's letters are green, joined where they
 * sit side by side in both words, capped on the answer's first and last letter. Each other letter
 * is yellow while the answer has an unmatched copy of it left (left to right), else dark.
 */
export function clue(guess: string, answer: string): Tile[] {
  const links = bestMatch(guess, answer);
  const at = new Map(links.map((l) => [l.g, l.a]));
  const left = leftOver(answer, links);

  return guess.split("").map((letter, g) => {
    const a = at.get(g);

    if (a !== undefined) return green(letter, a, at.get(g + 1), answer.length);

    const n = left.get(letter) ?? 0;
    left.set(letter, Math.max(0, n - 1));

    return loose(letter, n > 0);
  });
}
