import type { ComponentHandler } from "../../../core/types.ts";
import { toggleMode } from "../play/mode.ts";
import { SudokuRepo } from "../store/repo.ts";
import { act } from "./act.ts";

/** `sudoku:mode:<suffix>`: the Notes button flips the digit buttons between digits and notes. */
export const modeHandler: ComponentHandler = {
  id: "sudoku:mode",
  handle: (i, args, ctx) => act(i, new SudokuRepo(ctx.db), args, toggleMode),
};
