import type { MessageComponentInteraction } from "discord.js";
import { postOrLog } from "../../../core/send.ts";
import { announceText } from "../render/result.ts";
import type { Game } from "../types.ts";

/** The public line for a finished daily; a failed post is logged, the result still counts. */
export async function announce(i: MessageComponentInteraction, g: Game): Promise<void> {
  await postOrLog(i, "minesweeper", "could not announce a finished daily", announceText(g));
}
