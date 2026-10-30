import { WINDOWS, drop, landingRow, other, winningColumns } from "./board.ts";
import { type Board, COLS, type Disc, ROWS } from "./types.ts";

export const NAME: Record<Disc, string> = { R: "Red", Y: "Yellow" };

const CENTRE = 3;

const yn = (b: boolean): string => (b ? "yes" : "no");

const fromCentre = (col: number): string =>
  col === CENTRE ? "centre" : `${Math.abs(col - CENTRE)} from the centre`;

/** Some 4-cell window through `cell` holds three of `me` and one empty spot. */
const makesOpenThree = (b: Board, me: Disc, cell: number): boolean =>
  WINDOWS.some(
    (w) =>
      w.includes(cell) && w.filter((i) => b[i] === me).length === 3 && w.some((i) => b[i] === null),
  );

/**
 * What dropping in `col` does, worked out here so jevos only weighs it (it cannot read a board).
 * Wording in tic-tac-toe's probed style; keep the lines short and yes/no.
 */
export function columnFacts(b: Board, me: Disc, col: number): string {
  const them = other(me);
  const row = landingRow(b, col) ?? 0;
  const after = drop(b, col, me);
  const winsNow = winningColumns(b, me).includes(col);

  return [
    `Column ${col + 1} (${fromCentre(col)}), lands on row ${ROWS - row} of ${ROWS} from the bottom`,
    `- Dropping here gives ${NAME[me]} four in a row now: ${yn(winsNow)}`,
    `- Dropping here stops ${NAME[them]}'s four in a row next turn: ${yn(winningColumns(b, them).includes(col))}`,
    `- Dropping here makes three for ${NAME[me]} with the fourth spot still open: ${yn(!winsNow && makesOpenThree(after, me, row * COLS + col))}`,
    `- Dropping here gives ${NAME[me]} two ways to win next turn: ${yn(!winsNow && winningColumns(after, me).length >= 2)}`,
    `- After it, ${NAME[them]} can win on their next move: ${yn(!winsNow && winningColumns(after, them).length > 0)}`,
  ].join("\n");
}
