import type { MessageComponentInteraction, ModalSubmitInteraction } from "discord.js";
import { postOrLog } from "../../../core/send.ts";
import { resultLine } from "../render/result.ts";
import type { Game } from "../types.ts";

/** The public line for a finished daily; a failed post is logged, the game still counts. */
export const announce = (
  i: Pick<MessageComponentInteraction | ModalSubmitInteraction, "channel">,
  g: Game,
  number: number,
): Promise<void> =>
  postOrLog(i, "crossword", "could not announce a finished game", resultLine(number, g));
