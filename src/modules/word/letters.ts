import { feedback } from "./feedback.ts";
import type { LetterNotes } from "./types.ts";

const ALPHABET = "abcdefghijklmnopqrstuvwxyz".split("");

type Spots = Map<string, Set<number>>;

/** Hit spots, other tried spots, near letters and the hit pattern, read off the guesses. */
interface Marks {
  hits: Spots;
  tried: Spots;
  near: Set<string>;
  pattern: (string | null)[];
}

const add = (m: Spots, c: string, i: number): void => {
  m.set(c, (m.get(c) ?? new Set<number>()).add(i));
};

const sorted = (s: Set<number> | undefined): number[] => [...(s ?? [])].toSorted((a, b) => a - b);

function readMarks(guesses: string[], answer: string): Marks {
  const pattern = answer.split("").map(() => null);
  const m: Marks = { hits: new Map(), tried: new Map(), near: new Set(), pattern };

  for (const g of guesses) {
    for (const [i, mark] of feedback(g, answer).entries()) {
      const c = g[i] ?? "";

      if (mark === "hit") m.pattern[i] = c;

      if (mark === "near") m.near.add(c);

      add(mark === "hit" ? m.hits : m.tried, c, i);
    }
  }

  return m;
}

/** Every letter's status after `guesses`, worked out from their feedback against `answer`. */
export function letterNotes(guesses: string[], answer: string): LetterNotes {
  const { hits, tried, near, pattern } = readMarks(guesses, answer);
  const inWord = (c: string): boolean => hits.has(c) || near.has(c);

  return {
    placed: [...hits]
      .map(([letter, s]) => ({ letter, positions: sorted(s) }))
      .toSorted((a, b) => (a.positions[0] ?? 0) - (b.positions[0] ?? 0)),
    near: [...near]
      .filter((c) => !hits.has(c))
      .toSorted()
      .map((letter) => ({ letter, notAt: sorted(tried.get(letter)) })),
    untried: ALPHABET.filter((c) => !hits.has(c) && !tried.has(c)),
    out: ALPHABET.filter((c) => tried.has(c) && !inWord(c)),
    pattern,
  };
}
