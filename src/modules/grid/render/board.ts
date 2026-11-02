import { MAX_GUESSES } from "../play/answer.ts";
import { cellId, colLabel, rowLabel } from "./labels.ts";
import type { BoardView } from "./types.ts";

const header = (v: BoardView): string =>
  v.number === null
    ? `Practice grid · Guesses ${v.guesses}/${MAX_GUESSES}`
    : `Country grid #${v.number} · Guesses ${v.guesses}/${MAX_GUESSES} · ${v.points} pts`;

/** Header, the row and column rules, and the last wrong guess if any. */
export function renderBoard(v: BoardView): string {
  const rows = [0, 3, 6].map((i) => `${cellId(i)[0]} ${rowLabel(v.grid, i)}`);
  const cols = [0, 1, 2].map((i) => `${i + 1} ${colLabel(v.grid, i)}`);
  const lines = [header(v), `Rows: ${rows.join(" · ")}`, `Columns: ${cols.join(" · ")}`];

  if (v.lastMiss !== null) lines.push(`❌ ${v.lastMiss}`);

  return lines.join("\n");
}
