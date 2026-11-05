import type { BoardState } from "./types.ts";

/** Each board's guesses up to the one that solved it; every guess lands on every unsolved board. */
export const boardStates = (words: readonly string[], guesses: readonly string[]): BoardState[] =>
  words.map((word) => {
    const at = guesses.indexOf(word);

    return at < 0
      ? { word, guesses: [...guesses], solvedAt: null }
      : { word, guesses: guesses.slice(0, at + 1), solvedAt: at + 1 };
  });

/** How many of the words the guesses found. */
export const foundCount = (words: readonly string[], guesses: readonly string[]): number =>
  words.filter((w) => guesses.includes(w)).length;

/** Over once every board is solved or no attempts are left. */
export const isOver = (
  words: readonly string[],
  guesses: readonly string[],
  attempts: number,
): boolean => foundCount(words, guesses) === words.length || guesses.length >= attempts;
