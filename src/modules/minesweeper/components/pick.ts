import type { ComponentHandler } from "../../../core/types.ts";
import { moveCursor } from "../moves.ts";
import { GameStore } from "../store/games.ts";
import type { Axis } from "../types.ts";
import { act } from "./act.ts";

/** The Column or Row menu: moves the cursor. */
export function pickHandler(axis: Axis): ComponentHandler {
  return {
    id: `minesweeper:${axis}`,
    async handle(i, _args, ctx) {
      if (!i.isStringSelectMenu()) return;

      const value = Number(i.values[0] ?? 0);
      await act(i, new GameStore(ctx.db), (game) => ({
        game: moveCursor(game, axis, value),
        hint: null,
      }));
    },
  };
}
