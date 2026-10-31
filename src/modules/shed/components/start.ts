import type { ComponentHandler } from "../../../core/types.ts";
import { privately } from "./answer.ts";
import { STARTS } from "./replies.ts";

/** `shed:start`: the starter deals. */
export const startHandler: ComponentHandler = {
  id: "shed:start",
  handle: (i) => privately(i, async (r) => STARTS[await r.onStart(i.user.id, Date.now())]),
};
