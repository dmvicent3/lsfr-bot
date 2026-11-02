import type { ComponentHandler } from "../../../core/types.ts";
import { check } from "../play/check.ts";
import { SudokuRepo } from "../store/repo.ts";
import { act } from "./act.ts";

/** `sudoku:check:<suffix>`; a check marks the wrong cells and counts against the score. */
export const checkHandler: ComponentHandler = {
  id: "sudoku:check",
  handle: (i, args, ctx) => act(i, new SudokuRepo(ctx.db), args, check),
};
