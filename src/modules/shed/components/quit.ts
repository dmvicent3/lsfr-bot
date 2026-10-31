import type { ComponentHandler } from "../../../core/types.ts";
import { privately } from "./answer.ts";
import { QUITS } from "./replies.ts";

/** `shed:quit`: the board's Leave; out of the game with no place. */
export const quitHandler: ComponentHandler = {
  id: "shed:quit",
  handle: (i) => privately(i, async (r) => QUITS[await r.onQuit(i.user.id, Date.now())]),
};
