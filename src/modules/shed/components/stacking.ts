import type { ComponentHandler } from "../../../core/types.ts";
import { privately } from "./answer.ts";
import { STACKINGS } from "./replies.ts";

/** `shed:stacking`: the starter turns stacking on or off before the deal. */
export const stackingHandler: ComponentHandler = {
  id: "shed:stacking",
  handle: (i) => privately(i, async (r) => STACKINGS[await r.onStacking(i.user.id)]),
};
