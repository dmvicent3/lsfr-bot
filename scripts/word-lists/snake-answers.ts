/** Endings that make another word's plural, third person, past or participle. */
const ENDINGS = ["s", "es", "ed", "ing"];
const SHORTEST_STEM = 3;

/** The words `stem` could be once an ending is cut: as is, plus `e`, undoubled, `i` back to `y`. */
function stemsOf(stem: string): string[] {
  const out = [stem, `${stem}e`];

  if (stem.at(-1) === stem.at(-2)) out.push(stem.slice(0, -1));

  if (stem.endsWith("i")) out.push(`${stem.slice(0, -1)}y`);

  return out;
}

/** `word` ends in `-s`, `-es`, `-ed` or `-ing` on another dictionary word: walks, wishes, tried, running. */
export function isInflection(word: string, enable: ReadonlySet<string>): boolean {
  return ENDINGS.some((end) => {
    if (!word.endsWith(end) || (end === "s" && word.endsWith("ss"))) return false;

    return stemsOf(word.slice(0, -end.length)).some(
      (s) => s.length >= SHORTEST_STEM && enable.has(s),
    );
  });
}

export interface SnakeInput {
  enable: ReadonlySet<string>;
  /** Frequency list, most common first. */
  frequent: readonly string[];
  blocked: ReadonlySet<string>;
  /** How many of the most frequent words count as common. */
  common: number;
}

/** Snake answers: common dictionary words of 4–10 letters, not blocked, not an inflection; sorted. */
export const snakeAnswers = ({ enable, frequent, blocked, common }: SnakeInput): string[] =>
  frequent
    .slice(0, common)
    .filter(
      (w) =>
        /^[a-z]{4,10}$/.test(w) && enable.has(w) && !blocked.has(w) && !isInflection(w, enable),
    )
    .toSorted();
