import type { ComponentHandler } from "../../../core/types.ts";
import { privately } from "./answer.ts";
import { voteReply } from "./replies.ts";

/** `cards:vote:<roundId>:<index>`: one vote per player, changeable, never their own. */
export const voteHandler: ComponentHandler = {
  id: "cards:vote",
  handle: (i, args) => {
    const [roundId = "", index = ""] = args;
    const click = { roundId, userId: i.user.id, index: Number(index) };

    return privately(i, async (r) => voteReply(await r.onVote(click)));
  },
};
