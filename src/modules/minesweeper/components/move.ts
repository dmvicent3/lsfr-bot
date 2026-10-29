import type { ComponentHandler } from "../../../core/types.ts";
import { stepCursor } from "../cursor.ts";
import { GameStore } from "../store/games.ts";
import type { Direction } from "../types.ts";
import { act } from "./act.ts";

const DIRECTIONS: Record<string, Direction> = {
  up: "up",
  down: "down",
  left: "left",
  right: "right",
};

/** An arrow button ("minesweeper:move:<direction>"): moves the cursor one cell. */
export const moveHandler: ComponentHandler = {
  id: "minesweeper:move",
  async handle(i, args, ctx) {
    const dir = DIRECTIONS[args[0] ?? ""];

    if (!dir) return;

    await act(i, new GameStore(ctx.db), (game) => ({ game: stepCursor(game, dir), hint: null }));
  },
};
