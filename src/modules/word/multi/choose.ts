import { chooseWord } from "../choose-word.ts";

/**
 * `count` distinct answers, none in `exclude`, each one this server hasn't had yet while there
 * are any; picked one at a time the way the classic word is.
 */
export function chooseWords(
  answers: readonly string[],
  s: { used: ReadonlySet<string>; exclude: readonly string[]; count: number },
  random: () => number,
): string[] {
  const taken = new Set(s.exclude);
  const words: string[] = [];

  while (words.length < s.count) {
    const word = chooseWord(
      answers.filter((w) => !taken.has(w)),
      s.used,
      random,
    );

    if (!word) break;

    taken.add(word);
    words.push(word);
  }

  return words;
}
