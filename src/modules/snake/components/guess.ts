import { tell } from "../../../core/replies.ts";
import type { ComponentHandler } from "../../../core/types.ts";
import { guessLine } from "../render/board.ts";
import { PRACTICE } from "./guard.ts";

/**
 * `snake:guess:<date|practice>:<stamp>`: the Guess button of boards drawn before guessing moved to
 * `/snake guess`; it points to the command.
 */
export const guessHandler: ComponentHandler = {
  id: "snake:guess",
  async handle(i, args) {
    await tell(i, guessLine({ number: args[0] === PRACTICE ? null : 0 }));
  },
};
