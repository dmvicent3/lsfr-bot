import type { ComponentHandler } from "../../../core/types.ts";
import { clearAll } from "../play/clear-all.ts";
import { SudokuRepo } from "../store/repo.ts";
import { act } from "./act.ts";

/** `sudoku:clearall:<suffix>` */
export const clearAllHandler: ComponentHandler = {
  id: "sudoku:clearall",
  handle: (i, args, ctx) => act(i, new SudokuRepo(ctx.db), args, clearAll),
};
