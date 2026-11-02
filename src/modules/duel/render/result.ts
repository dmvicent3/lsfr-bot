import { flag } from "../../../core/countries/flag.ts";
import { formatValue } from "../data/format.ts";
import { STAT_BY_ID } from "../data/stats.ts";
import { correctCount } from "../play/answer.ts";
import type { Award, Game, Puzzle, Question, Side } from "../types.ts";
import { tally } from "./question.ts";

/** ✅ Right / ❌ Wrong, then both countries with values; one year when they match, none if timeless. */
export function renderReveal(q: Question, pick: "a" | "b"): string {
  const timeless = STAT_BY_ID[q.stat].timeless === true;
  const same = q.a.year === q.b.year;

  const part = (s: Side): string => {
    const text = `${flag(s.iso2)} ${s.name} ${formatValue(q.stat, s)}`;

    return same || timeless ? text : `${text} (${s.year})`;
  };

  const line = `${part(q.a)} · ${part(q.b)}`;
  const shown = same && !timeless ? `${line} (${q.a.year})` : line;

  return `${q.higher === pick ? "✅ Right" : "❌ Wrong"}\n${shown}`;
}

/** The breakdown just earned, else the stored points of an earlier finish, else nothing. */
function scoreLines(g: Game, award: Award | null): string[] {
  if (award) return ["", ...award.parts, `**+${award.points} points**`];

  return g.points === null ? [] : ["", `**${g.points} points**`];
}

/** The finished game: tally, score, the points breakdown when just earned, time to the next. */
export function renderResult(
  puzzle: Puzzle,
  g: Game,
  award: Award | null,
  untilNext: string,
): string {
  const head = `${tally(puzzle, g.answers)}\n${correctCount(puzzle, g.answers)}/${puzzle.questions.length} correct`;

  return [head, ...scoreLines(g, award), "", `Next puzzle in ${untilNext}`].join("\n");
}
