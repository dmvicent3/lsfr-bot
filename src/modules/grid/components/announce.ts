import type { ChatInputCommandInteraction, MessageComponentInteraction } from "discord.js";
import { postOrLog } from "../../../core/send.ts";
import { CELLS } from "../scoring.ts";
import { shareGrid } from "../render/result.ts";
import type { Game } from "../types.ts";

/** The public line for a finished daily game; a failed post is logged, the game still counts. */
export async function announce(
  i: Pick<MessageComponentInteraction | ChatInputCommandInteraction, "channel">,
  g: Game,
  number: number,
): Promise<void> {
  const head = `<@${g.userId}> filled ${g.filled ?? 0}/${CELLS} on Country grid #${number}`;

  await postOrLog(
    i,
    "grid",
    "could not announce a finished game",
    `${head} — ${g.points ?? 0} pts\n${shareGrid(g.cells)}`,
  );
}
