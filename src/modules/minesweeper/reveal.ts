import { adjacentMines } from "./field.ts";
import { neighbours } from "./grid.ts";
import type { Board, CellState, RevealStep } from "./types.ts";

const FLAGGED = "Flagged — remove the flag to reveal it.";

const NOTHING = "Nothing left to open there.";

const unchanged = (board: Board, hint: string): RevealStep => ({
  cells: board.cells,
  hit: null,
  hint,
});

const flagHint = (n: number): string =>
  `Flag ${n} ${n === 1 ? "neighbour" : "neighbours"} first to open around it.`;

/** Opens `start` and, breadth-first, everything a 0 touches; flags are never opened. */
function flood(board: Board, field: boolean[], cells: CellState[], start: number): void {
  const queue = [start];

  for (let c = queue.shift(); c !== undefined; c = queue.shift()) {
    if (cells[c] !== "hidden") continue;

    cells[c] = "open";
    const around = neighbours(c, board.width, board.height);

    if (adjacentMines(field, c, board.width, board.height) === 0) queue.push(...around);
  }
}

/** Reveals each target in order; the first mine stops it as the hit. */
function open(board: Board, field: boolean[], targets: number[]): RevealStep {
  const cells = [...board.cells];

  for (const t of targets) {
    if (field[t]) return { cells, hit: t, hint: null };

    flood(board, field, cells, t);
  }

  return { cells, hit: null, hint: null };
}

/** An open number with as many flags around it opens its other neighbours. */
function chord(board: Board, field: boolean[], i: number): RevealStep {
  const around = neighbours(i, board.width, board.height);
  const hidden = around.filter((n) => board.cells[n] === "hidden");
  const flags = around.filter((n) => board.cells[n] === "flag").length;
  const count = adjacentMines(field, i, board.width, board.height);

  if (hidden.length === 0) return unchanged(board, NOTHING);

  if (flags !== count) return unchanged(board, flagHint(count));

  return open(board, field, hidden);
}

/** Reveal on cell `i` of a board whose mines are laid. */
export function revealAt(board: Board, i: number): RevealStep {
  const field = board.field ?? [];
  const state = board.cells[i];

  if (state === "flag") return unchanged(board, FLAGGED);

  if (state === "hidden") return open(board, field, [i]);

  return chord(board, field, i);
}
