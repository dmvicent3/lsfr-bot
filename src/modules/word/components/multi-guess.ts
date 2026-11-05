import { tell } from "../../../core/replies.ts";
import type { ComponentHandler } from "../../../core/types.ts";
import { modeOf } from "../multi/modes.ts";
import { GONE } from "./multi-round.ts";

/**
 * `word:guess:<mode>:<date>`: the Guess button of boards drawn before guessing moved to
 * `/duo guess` and `/quad guess`; it points to the command.
 */
export const multiGuessHandler: ComponentHandler = {
  id: "word:guess",
  async handle(i, args) {
    const mode = modeOf(args[0]);

    await tell(i, mode ? `Guess with \`/${mode} guess\` now.` : GONE);
  },
};
