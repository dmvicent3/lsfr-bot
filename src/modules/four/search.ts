import { landingRow, legalColumns, winningColumns } from "./board.ts";
import { type Board, COLS, type Cell, type Disc, ROWS } from "./types.ts";

/** jevos's drop plus five more: deep enough to see most traps, quick on the Pi. */
export const SEARCH_DEPTH = 6;

/** Centre columns first, so alpha-beta cuts early. */
const ORDER = [3, 2, 4, 1, 5, 0, 6] as const;

const DIRS = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
] as const;

/** A board being searched: cells changed in place, drops undone on the way back. */
interface State {
  cells: Cell[];
  heights: number[];
}

const swap = (d: Disc): Disc => (d === "R" ? "Y" : "R");

function run(s: State, row: number, col: number, [dr, dc]: readonly [number, number]): number {
  const d = s.cells[row * COLS + col];
  let n = 0;

  for (let k = 1; k < 4; k++) {
    const r = row + k * dr;
    const c = col + k * dc;

    if (r < 0 || r >= ROWS || c < 0 || c >= COLS || s.cells[r * COLS + c] !== d) break;

    n++;
  }

  return n;
}

/** Whether the disc just dropped at (row, col) made four. */
const madeFour = (s: State, row: number, col: number): boolean =>
  DIRS.some(([dr, dc]) => 1 + run(s, row, col, [dr, dc]) + run(s, row, col, [-dr, -dc]) >= 4);

const place = (s: State, col: number, d: Disc): number => {
  const row = ROWS - 1 - (s.heights[col] ?? 0);
  s.cells[row * COLS + col] = d;
  s.heights[col] = (s.heights[col] ?? 0) + 1;

  return row;
};

const lift = (s: State, col: number, row: number): void => {
  s.cells[row * COLS + col] = null;
  s.heights[col] = (s.heights[col] ?? 1) - 1;
};

const open = (s: State, col: number): boolean => (s.heights[col] ?? ROWS) < ROWS;

/** 1 when `me` (to move) wins within `depth` plies by force, -1 when it loses, else 0. */
function negamax(s: State, me: Disc, depth: number, window: [number, number]): number {
  if (depth <= 0) return 0;

  const cols = ORDER.filter((c) => open(s, c));
  const wins = cols.some((c) => {
    const row = place(s, c, me);
    const four = madeFour(s, row, c);
    lift(s, c, row);

    return four;
  });

  if (wins) return 1;

  return bestReply(s, me, depth, cols, window);
}

function bestReply(s: State, me: Disc, depth: number, cols: number[], [a, b]: [number, number]) {
  let best = cols.length > 0 ? -1 : 0;
  let alpha = a;

  for (const c of cols) {
    const row = place(s, c, me);
    const v = -negamax(s, swap(me), depth - 1, [-b, -alpha]);
    lift(s, c, row);
    best = Math.max(best, v);
    alpha = Math.max(alpha, v);

    if (alpha >= b) break;
  }

  return best;
}

const stateOf = (b: Board): State => ({
  cells: [...b],
  heights: Array.from({ length: COLS }, (_, c) => ROWS - 1 - (landingRow(b, c) ?? -1)),
});

/** Legal columns after which `me` loses by force within `depth` plies, its own drop counted. */
export function lostColumns(b: Board, me: Disc, depth: number): number[] {
  const wins = winningColumns(b, me);
  const s = stateOf(b);

  return legalColumns(b).filter((c) => {
    if (wins.includes(c)) return false;

    const row = place(s, c, me);
    const v = negamax(s, swap(me), depth - 1, [-1, 1]);
    lift(s, c, row);

    return v === 1;
  });
}
