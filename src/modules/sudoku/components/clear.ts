import type { ComponentHandler } from "../../../core/types.ts";
import { clear } from "../play/clear.ts";
import { SudokuRepo } from "../store/repo.ts";
import { act } from "./act.ts";

/** `sudoku:clear:<suffix>` */
export const clearHandler: ComponentHandler = {
  id: "sudoku:clear",
  handle: (i, args, ctx) => act(i, new SudokuRepo(ctx.db), args, clear),
};
