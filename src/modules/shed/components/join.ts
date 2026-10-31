import type { ComponentHandler } from "../../../core/types.ts";
import { memberName } from "../../trivia/commands/name.ts";
import { playingElsewhere } from "../session/registry.ts";
import { privately } from "./answer.ts";
import { JOINS } from "./replies.ts";

/** `shed:join`: a seat in the lobby, unless the person is in a game in another channel. */
export const joinHandler: ComponentHandler = {
  id: "shed:join",
  handle: (i) =>
    privately(i, async (r) => {
      const elsewhere = playingElsewhere(r.state.guildId, i.user.id, i.channelId);

      return JOINS[await r.onJoin({ userId: i.user.id, name: memberName(i) }, elsewhere)];
    }),
};
