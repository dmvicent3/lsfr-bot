import type { Ends, Link, Tile } from "../types.ts";
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

/** A green tile for guess letter `link.g` on answer letter `link.a`; `next` is the next letter's. */
const green = (letter: string, link: Link, next: number | undefined, ends: Ends): Tile => ({
  letter,
  colour: "green",
  joinNext: next === link.a + 1,
  capStart: link.g === 0 && link.a === 0,
  capEnd: link.g === ends.guess - 1 && link.a === ends.answer - 1,
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
 * sit side by side in both words, capped where the guess's own first or last letter sits on the
 * answer's first or last (it starts or ends as the word does). Each other letter
 * is yellow while the answer has an unmatched copy of it left (left to right), else dark.
 */
export function clue(guess: string, answer: string): Tile[] {
  const links = bestMatch(guess, answer);
  const at = new Map(links.map((l) => [l.g, l.a]));
  const left = leftOver(answer, links);
  const ends = { guess: guess.length, answer: answer.length };

  return guess.split("").map((letter, g) => {
    const a = at.get(g);

    if (a !== undefined) return green(letter, { g, a }, at.get(g + 1), ends);

    const n = left.get(letter) ?? 0;
    left.set(letter, Math.max(0, n - 1));

    return loose(letter, n > 0);
  });
}
