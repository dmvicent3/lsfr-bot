import type { ComponentHandler } from "../../../core/types.ts";
import { inHand } from "./answer.ts";

/** `shed:page:<page>`: another page of the hand's card buttons. */
export const pageHandler: ComponentHandler = {
  id: "shed:page",
  handle: (i, args) =>
    inHand(i, async (r) => ({ note: "", hand: await r.onHand(i.user.id, Number(args[0]) || 1) })),
};
