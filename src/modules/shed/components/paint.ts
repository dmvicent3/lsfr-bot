import type { ComponentHandler } from "../../../core/types.ts";
import { COLOURS } from "../game/deck.ts";
import { inHand, turnClick } from "./answer.ts";
import { PAINTS } from "./replies.ts";

/** `shed:paint:<turn>:<colour>`: the colour after a Paint. */
export const paintHandler: ComponentHandler = {
  id: "shed:paint",
  handle: (i, [turn, picked]) =>
    inHand(i, async (r) => {
      const colour = COLOURS.find((c) => c === picked) ?? "red";
      const out = await r.onPaint({ ...turnClick(i, turn), colour });

      return { note: PAINTS[out.result], hand: out.hand };
    }),
};
