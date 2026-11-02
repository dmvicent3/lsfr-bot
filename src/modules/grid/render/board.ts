import { RULES } from "../rules/catalogue.ts";
import { ROW_LETTERS } from "./labels.ts";
import type { BoardView } from "./types.ts";

const header = (v: BoardView): string =>
  v.number === null
    ? `Practice grid · Guesses ${v.guesses}/9`
    : `Country grid #${v.number} · Guesses ${v.guesses}/9 · ${v.points} pts`;

/** Header, the row and column rules, and the last wrong guess if any. */
export function renderBoard(v: BoardView): string {
  const rows = v.grid.rows.map((r, i) => `${ROW_LETTERS[i]} ${RULES[r].label}`);
  const cols = v.grid.cols.map((c, i) => `${i + 1} ${RULES[c].label}`);
  const lines = [header(v), `Rows: ${rows.join(" · ")}`, `Columns: ${cols.join(" · ")}`];

  if (v.lastMiss !== null) lines.push(`❌ ${v.lastMiss}`);

  return lines.join("\n");
}
