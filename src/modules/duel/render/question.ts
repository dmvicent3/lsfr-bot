import { STAT_BY_ID } from "../data/stats.ts";
import type { Game, Puzzle } from "../types.ts";

/** One square per question: right, wrong, or not answered yet. */
export function tally(puzzle: Puzzle, answers: string): string {
  return puzzle.questions
    .map((q, i) => {
      const pick = answers[i];

      if (pick === undefined) return "⬜";

      return q.higher === pick ? "🟩" : "🟥";
    })
    .join("");
}

/** The question the player is on; its buttons carry the two countries. */
export function renderQuestion(puzzle: Puzzle, g: Game, number: number): string {
  const n = g.answers.length + 1;
  const label = STAT_BY_ID[puzzle.questions[n - 1]?.stat ?? "population"].label;

  return [
    `Stat duel #${number} · Question ${n}/${puzzle.questions.length}`,
    `Which has the higher **${label}**?`,
    tally(puzzle, g.answers),
  ].join("\n");
}
