import { flag } from "../../../core/countries/flag.ts";
import type { Snapshot } from "../../../core/countries/types.ts";
import { cellPoints, obscurity } from "../scoring.ts";
import { cellId } from "./labels.ts";
import { countryNames } from "./names.ts";
import type { BoardView } from "./types.ts";

/** Three lines of 🟩 (filled) and ⬜ (empty) for the announcement. */
export const shareGrid = (cells: string[]): string =>
  [0, 3, 6]
    .map((r) =>
      cells
        .slice(r, r + 3)
        .map((c) => (c ? "🟩" : "⬜"))
        .join(""),
    )
    .join("\n");

function cellLine(v: BoardView, i: number, snap: Snapshot, obs: Map<string, number>): string {
  const names = countryNames(snap);
  const name = (iso2: string) => names.get(iso2) ?? iso2;
  const iso2 = v.cells[i]!;

  if (iso2) {
    return `${cellId(i)} ${flag(iso2)} ${name(iso2)} +${cellPoints(iso2, obs.get(iso2) ?? 1)}`;
  }

  const answers = v.grid.answers[i]!;
  const top = answers.toSorted((a, b) => (obs.get(b) ?? 1) - (obs.get(a) ?? 1))[0]!;

  return `${cellId(i)} — ${answers.length} fit, e.g. ${flag(top)} ${name(top)}`;
}

const scoreLines = (v: BoardView): string[] =>
  v.award ? [...v.award.parts, `**+${v.award.points} points**`] : [`**${v.points} points**`];

/** The finished grid: every cell, the points, and for a daily the time to the next. */
export function renderResult(v: BoardView, snap: Snapshot): string {
  const obs = obscurity(snap);
  const cells = v.cells.map((_, i) => cellLine(v, i, snap, obs));
  const next = v.number !== null && v.untilNext ? ["", `Next grid in ${v.untilNext}`] : [];

  return [...cells, "", ...scoreLines(v), ...next].join("\n");
}
