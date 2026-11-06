import type { ComponentHandler } from "../../../core/types.ts";
import { applyReveal } from "../moves.ts";
import { act } from "./act.ts";

export function revealHandler(random: () => number): ComponentHandler {
  return {
    id: "minesweeper:reveal",
    async handle(i, _args, ctx) {
      await act(i, ctx, (game) => applyReveal(game, Date.now(), random));
    },
  };
}
