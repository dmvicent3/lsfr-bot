import type { ComponentHandler } from "../../../core/types.ts";
import { move } from "../play/move.ts";
import { SudokuRepo } from "../store/repo.ts";
import type { Direction } from "../types.ts";
import { act } from "./act.ts";
import { STALE, tell } from "./guard.ts";

const DIRECTIONS: readonly string[] = ["left", "up", "down", "right"] satisfies Direction[];

const isDirection = (s: string | undefined): s is Direction => !!s && DIRECTIONS.includes(s);

/** `sudoku:move:<dir>:<suffix>` */
export const moveHandler: ComponentHandler = {
  id: "sudoku:move",
  async handle(i, args, ctx) {
    const dir = args[0];

    if (!isDirection(dir)) return tell(i, STALE);

    await act(i, new SudokuRepo(ctx.db), args.slice(1), (g) => move(g, dir));
  },
};
