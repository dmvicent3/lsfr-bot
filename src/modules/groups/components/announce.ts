import type { MessageComponentInteraction } from "discord.js";
import { postOrLog } from "../../../core/send.ts";
import { resultLine } from "../render/result.ts";
import type { Game, Puzzle } from "../types.ts";

/** The public line for a finished daily; a failed post is logged, the game still counts. */
export const announce = (
  i: Pick<MessageComponentInteraction, "channel">,
  g: Game,
  v: { number: number; puzzle: Puzzle },
): Promise<void> =>
  postOrLog(i, "groups", "could not announce a finished game", resultLine(v.number, g, v.puzzle));
