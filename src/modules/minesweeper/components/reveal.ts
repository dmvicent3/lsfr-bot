import type { ComponentHandler } from "../../../core/types.ts";
import { applyReveal } from "../moves.ts";
import { GameStore } from "../store/games.ts";
import { act } from "./act.ts";

export function revealHandler(random: () => number): ComponentHandler {
  return {
    id: "minesweeper:reveal",
    async handle(i, _args, ctx) {
      await act(i, new GameStore(ctx.db), (game) => applyReveal(game, Date.now(), random));
    },
  };
}
