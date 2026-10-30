import type { ComponentHandler } from "../../../core/types.ts";
import { privately } from "./answer.ts";
import { LEAVES } from "./replies.ts";

/** `cards:leave`: out of the game; a card already played this round stays in. */
export const leaveHandler: ComponentHandler = {
  id: "cards:leave",
  handle: (i) => privately(i, async (r) => LEAVES[await r.onLeave(i.user.id)]),
};
