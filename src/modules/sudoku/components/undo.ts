import type { ComponentHandler } from "../../../core/types.ts";
import { undo } from "../play/undo.ts";
import { SudokuRepo } from "../store/repo.ts";
import { act } from "./act.ts";

/** `sudoku:undo:<suffix>`: goes back to the board before the last edit. */
export const undoHandler: ComponentHandler = {
  id: "sudoku:undo",
  handle: (i, args, ctx) => act(i, new SudokuRepo(ctx.db), args, undo),
};
