import type { ComponentHandler } from "../../../core/types.ts";
import { inHand, turnClick } from "./answer.ts";
import { PASSES } from "./replies.ts";

/** `shed:pass:<turn>`: keep the drawn card, end the turn. */
export const passHandler: ComponentHandler = {
  id: "shed:pass",
  handle: (i, [turn]) =>
    inHand(i, async (r) => {
      const out = await r.onPass(turnClick(i, turn));

      return { note: PASSES[out.result], hand: out.hand };
    }),
};
