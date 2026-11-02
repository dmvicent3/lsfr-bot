import { tell } from "../../../core/replies.ts";
import type { ComponentHandler } from "../../../core/types.ts";
import { put } from "../play/put.ts";
import { SudokuRepo } from "../store/repo.ts";
import { act } from "./act.ts";
import { STALE } from "./guard.ts";

/** `sudoku:put:<1-9>:<suffix>` */
export const putHandler: ComponentHandler = {
  id: "sudoku:put",
  async handle(i, args, ctx) {
    if (!/^[1-9]$/.test(args[0] ?? "")) return tell(i, STALE);

    await act(i, new SudokuRepo(ctx.db), args.slice(1), (g) => put(g, Number(args[0])));
  },
};
