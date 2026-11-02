import { matchCountry } from "../match/match.ts";
import type { Country } from "../../../core/countries/types.ts";
import { RULES } from "../rules/catalogue.ts";
import { failures } from "../rules/explain.ts";
import type { RuleId } from "../types.ts";
import { CELLS, cellPoints } from "../scoring.ts";
import type { Outcome, PlayState, Reference } from "./types.ts";

export const MAX_GUESSES = 9;

/** Shown when no rule fails: the stored answers no longer match the data. */
export const NO_FIT = "doesn't fit this cell";

/** All cells filled or out of guesses. */
export const isOver = (cells: string[], guesses: number): boolean =>
  cells.filter((c) => c !== "").length === CELLS || guesses >= MAX_GUESSES;

/** The line the board shows under a wrong guess. */
export const missLine = (name: string, reasons: string[]): string =>
  `${name}: ${reasons.join(", ")}`;

/** The stat a cell rule needs, when every rule this country fails lacks its reading. */
function missingData(ids: RuleId[], c: Country): string | null {
  const failed = ids.map((id) => RULES[id]).filter((r) => !r.test(c));
  const rule = failed[0];

  if (!rule || failed.some((r) => r.known?.(c) !== false)) return null;

  return rule.why.split(" isn't")[0] ?? rule.label;
}

/** A guess that fits neither the cell nor the answers: free when its data is missing, else a miss. */
function wrong(state: PlayState, cell: number, found: Country): Outcome {
  const { grid, cells, guesses } = state;
  const ids = [grid.rows[Math.floor(cell / 3)]!, grid.cols[cell % 3]!];
  const label = missingData(ids, found);

  if (label) return { kind: "nodata", name: found.name, label };

  const failed = failures(ids, found);
  const reasons = failed.length > 0 ? failed : [NO_FIT];

  return { kind: "miss", name: found.name, reasons, cells, guesses: guesses + 1 };
}

/** Judges a guess for a cell (0..8) without storing anything. */
export function submit(state: PlayState, cell: number, text: string, ref: Reference): Outcome {
  const { grid, cells, guesses } = state;

  if (state.finished || cells[cell] !== "" || guesses >= MAX_GUESSES) return { kind: "stale" };

  const found = matchCountry(text, ref.snapshot);

  if (!found) return { kind: "unknown", text };

  if (cells.includes(found.iso2)) return { kind: "used", name: found.name };

  if (grid.answers[cell]?.includes(found.iso2)) {
    const points = cellPoints(found.iso2, ref.obscurity.get(found.iso2) ?? 1);
    const next = cells.with(cell, found.iso2);

    return { kind: "hit", iso2: found.iso2, points, cells: next, guesses: guesses + 1 };
  }

  return wrong(state, cell, found);
}
