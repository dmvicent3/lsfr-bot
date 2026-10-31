import type { ComponentHandler } from "../../../core/types.ts";
import { privately } from "./answer.ts";
import { LEAVES } from "./replies.ts";

/** `shed:leave`: out of the lobby. */
export const leaveHandler: ComponentHandler = {
  id: "shed:leave",
  handle: (i) => privately(i, async (r) => LEAVES[await r.onLeave(i.user.id)]),
};
