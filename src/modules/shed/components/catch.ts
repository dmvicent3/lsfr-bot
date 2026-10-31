import type { ComponentHandler } from "../../../core/types.ts";
import { privately } from "./answer.ts";
import { CATCHES } from "./replies.ts";

/** `shed:catch:<turn>`: anyone still on one uncalled card draws 2; the turn in the ID is not checked. */
export const catchHandler: ComponentHandler = {
  id: "shed:catch",
  handle: (i) => privately(i, async (r) => CATCHES[await r.onCatch(i.user.id)]),
};
