import { puzzleNumber } from "../../../core/daily.ts";
import { FIRST_PUZZLE } from "../periods.ts";
import type { Game } from "../types.ts";
import { formatDuration } from "./duration.ts";

const plural = (n: number, word: string): string => `${n} ${word}${n === 1 ? "" : "s"}`;

const capital = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

const heading = (g: Game): string[] =>
  g.kind === "practice"
    ? ["Practice", capital(g.level)]
    : [capital(g.level), `#${puzzleNumber(g.date, FIRST_PUZZLE)}`];

/** "Easy · #3 · 4m 12s · 1 check · 23 left"; practice has no number; solved shows the time taken. */
export function renderStatus(g: Game, now: number): string {
  const checks = plural(g.checks, "check");

  if (g.solvedAt !== null) {
    const took = `Solved in ${formatDuration(g.solvedAt - g.startedAt)}`;
    const points = g.kind === "daily" && g.points !== null ? ` · ${g.points} pts` : "";

    return [...heading(g), took, checks].join(" · ") + points;
  }

  const left = g.cells.split("").filter((c) => c === "0").length;

  return [...heading(g), formatDuration(now - g.startedAt), checks, `${left} left`].join(" · ");
}
