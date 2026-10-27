import type { Board, Cell } from "../../../src/modules/tictactoe/types.ts";

const CELLS: Record<string, Cell> = { "-": null, X: "X", O: "O" };

/** A board from 9 characters of "-", "X" and "O". */
export const board = (cells: string): Board => cells.split("").map((c) => CELLS[c] ?? null);
