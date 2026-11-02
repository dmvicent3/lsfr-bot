import type { Game, Puzzle } from "../types.ts";

export const isDone = (puzzle: Puzzle, g: Game): boolean =>
  g.answers.length === puzzle.questions.length;

export function correctCount(puzzle: Puzzle, answers: string): number {
  return answers.split("").filter((pick, i) => puzzle.questions[i]?.higher === pick).length;
}

/** Records answer `n` (1-based, in order); null when finished or out of order. */
export function answer(
  puzzle: Puzzle,
  g: Game,
  n: number,
  pick: "a" | "b",
): { game: Game; right: boolean } | null {
  if (g.finishedAt !== null || n !== g.answers.length + 1 || n > puzzle.questions.length) {
    return null;
  }

  const right = puzzle.questions[n - 1]?.higher === pick;

  return { game: { ...g, answers: g.answers + pick }, right };
}
