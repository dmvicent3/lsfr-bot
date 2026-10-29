import type { ComponentHandler } from "../../../core/types.ts";
import { applyGiveUp } from "../moves.ts";
import { GameStore } from "../store/games.ts";
import { act } from "./act.ts";

/** Ends the game; one given up before the first reveal stays out of stats (never started). */
export const giveUpHandler: ComponentHandler = {
  id: "minesweeper:giveup",
  async handle(i, _args, ctx) {
    await act(i, new GameStore(ctx.db), (game) => ({
      game: applyGiveUp(game, Date.now()),
      hint: null,
    }));
  },
};
