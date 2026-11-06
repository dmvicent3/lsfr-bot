import type { ComponentHandler } from "../../../core/types.ts";
import { applyFlag } from "../moves.ts";
import { act } from "./act.ts";

export const flagHandler: ComponentHandler = {
  id: "minesweeper:flag",
  async handle(i, _args, ctx) {
    await act(i, ctx, applyFlag);
  },
};
