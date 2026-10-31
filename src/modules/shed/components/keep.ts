import type { ComponentHandler } from "../../../core/types.ts";
import { inHand, turnClick } from "./answer.ts";
import { KEEPS } from "./replies.ts";

/** `shed:keep:<turn>:<last>`: play the card just drawn. */
export const keepHandler: ComponentHandler = {
  id: "shed:keep",
  handle: (i, [turn, last]) =>
    inHand(i, async (r) => {
      const out = await r.onKeep({ ...turnClick(i, turn), last: last === "1" });

      return { note: KEEPS[out.result], hand: out.hand };
    }),
};
