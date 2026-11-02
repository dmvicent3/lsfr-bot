import type { MessageComponentInteraction } from "discord.js";
import { puzzleNumber } from "../../../core/daily.ts";
import { log } from "../../../core/log.ts";
import { FIRST_PUZZLE } from "../periods.ts";
import { formatDuration } from "../render/duration.ts";
import type { Game } from "../types.ts";

/** The public line for a solved daily; a failed post is logged, the solve still counts. */
export async function announce(i: MessageComponentInteraction, g: Game): Promise<void> {
  const checks = `${g.checks} check${g.checks === 1 ? "" : "s"}`;
  const took = formatDuration((g.solvedAt ?? g.startedAt) - g.startedAt);
  const number = puzzleNumber(g.date, FIRST_PUZZLE);
  const content = `<@${g.userId}> solved Sudoku #${number} (${g.level}) in ${took}, ${checks}`;

  try {
    if (!i.channel || !("send" in i.channel)) {
      log.error("sudoku", "could not announce a solved puzzle: no channel to send to");

      return;
    }

    await i.channel.send({ content, allowedMentions: { parse: [] } });
  } catch (err) {
    log.error("sudoku", "could not announce a solved puzzle", err);
  }
}
