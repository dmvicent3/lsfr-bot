import type { ComponentHandler } from "../../../core/types.ts";
import { memberName } from "../../trivia/commands/name.ts";
import { privately } from "./answer.ts";
import { JOINS } from "./replies.ts";

/** `cards:join`: a seat in the lobby, or a hand mid-game. */
export const joinHandler: ComponentHandler = {
  id: "cards:join",
  handle: (i) =>
    privately(i, async (r) => JOINS[await r.onJoin({ userId: i.user.id, name: memberName(i) })]),
};
