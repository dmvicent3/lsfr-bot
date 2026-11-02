import { flag } from "../data/flag.ts";
import { formatValue } from "../data/format.ts";
import { correctCount } from "../play/answer.ts";
import type { Award, Game, Puzzle, Question, Side } from "../types.ts";
import { tally } from "./question.ts";

/** ✅ Right / ❌ Wrong, then both countries with their values; one year when they match. */
export function renderReveal(q: Question, pick: "a" | "b"): string {
  const same = q.a.year === q.b.year;

  const part = (s: Side): string => {
    const text = `${flag(s.iso2)} ${s.name} ${formatValue(q.stat, s)}`;

    return same ? text : `${text} (${s.year})`;
  };

  const line = `${part(q.a)} · ${part(q.b)}`;

  return `${q.higher === pick ? "✅ Right" : "❌ Wrong"}\n${same ? `${line} (${q.a.year})` : line}`;
}

/** The finished game: tally, score, the points breakdown when just earned, time to the next. */
export function renderResult(
  puzzle: Puzzle,
  g: Game,
  award: Award | null,
  untilNext: string,
): string {
  const head = `${tally(puzzle, g.answers)}\n${correctCount(puzzle, g.answers)}/${puzzle.questions.length} correct`;
  const lines = award ? ["", ...award.parts, `**+${award.points} points**`] : [];

  return [head, ...lines, "", `Next puzzle in ${untilNext}`].join("\n");
}
