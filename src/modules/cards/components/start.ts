import type { ComponentHandler } from "../../../core/types.ts";
import { privately } from "./answer.ts";
import { STARTS } from "./replies.ts";

/** `cards:start`: only whoever opened the lobby, with 3+ players in. */
export const startHandler: ComponentHandler = {
  id: "cards:start",
  handle: (i) => privately(i, async (r) => STARTS[await r.onStart(i.user.id, Date.now())]),
};
