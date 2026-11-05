import type { MessageComponentInteraction } from "discord.js";
import { postOrLog } from "../../../core/send.ts";
import { resultLine } from "../render/result.ts";
import type { Where } from "../render/types.ts";
import type { Game } from "../types.ts";

/** The public post for a finished daily; a failed post is logged, the game still counts. */
export const announce = (
  i: Pick<MessageComponentInteraction, "channel">,
  g: Game,
  where: Pick<Where, "number" | "answer">,
): Promise<void> =>
  postOrLog(
    i,
    "snake",
    "could not announce a finished game",
    resultLine(where.number ?? 0, g, where.answer),
  );
