import type { ComponentHandler } from "../../../core/types.ts";
import { inHand, turnClick } from "./answer.ts";
import { DRAWS } from "./replies.ts";

/** `shed:draw:<turn>`: draw one, or take the waiting draw. */
export const drawHandler: ComponentHandler = {
  id: "shed:draw",
  handle: (i, [turn]) =>
    inHand(i, async (r) => {
      const out = await r.onDraw(turnClick(i, turn));

      return { note: DRAWS[out.result], hand: out.hand };
    }),
};
