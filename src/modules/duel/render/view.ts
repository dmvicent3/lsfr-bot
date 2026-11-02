import type { Award, Game, Puzzle } from "../types.ts";
import { nextButton, pickButtons } from "./buttons.ts";
import { renderQuestion, tally } from "./question.ts";
import { renderResult, renderReveal } from "./result.ts";

export interface ViewContext {
  /** The puzzle number shown in the header. */
  number: number;
  /** Time to the next puzzle, from core `untilNext`. */
  untilNext: string;
  /** True right after an answer: show the reveal for the player's last pick. */
  revealed?: boolean;
  /** The points breakdown, only on the move that finished the game. */
  award?: Award | null;
}

const MENTIONS = { parse: [] as [] };

function revealed(puzzle: Puzzle, g: Game, c: ViewContext) {
  const last = g.answers.length;
  const reveal = renderReveal(puzzle.questions[last - 1]!, g.answers[last - 1] === "a" ? "a" : "b");

  if (g.finishedAt !== null) {
    const result = renderResult(puzzle, g, c.award ?? null, c.untilNext);

    return { content: `${reveal}\n\n${result}`, components: [] };
  }

  return { content: `${reveal}\n\n${tally(puzzle, g.answers)}`, components: nextButton(g.date) };
}

/**
 * The game message in one of three states: the question (buttons to pick),
 * the reveal after an answer (Next, or the result after the last), or the
 * finished result (no buttons).
 */
export function view(puzzle: Puzzle, g: Game, c: ViewContext) {
  if (c.revealed && g.answers.length > 0) {
    return { ...revealed(puzzle, g, c), allowedMentions: MENTIONS };
  }

  if (g.finishedAt !== null) {
    const content = renderResult(puzzle, g, c.award ?? null, c.untilNext);

    return { content, components: [], allowedMentions: MENTIONS };
  }

  const n = g.answers.length + 1;

  return {
    content: renderQuestion(puzzle, g, c.number),
    components: pickButtons(g.date, n, puzzle.questions[n - 1]!),
    allowedMentions: MENTIONS,
  };
}
