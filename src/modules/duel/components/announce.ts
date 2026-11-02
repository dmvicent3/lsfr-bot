import type { MessageComponentInteraction } from "discord.js";
import { puzzleNumber } from "../../../core/daily.ts";
import { postOrLog } from "../../../core/send.ts";
import { FIRST_PUZZLE } from "../periods.ts";
import { tally } from "../render/question.ts";
import type { Game, Puzzle } from "../types.ts";

/** The public line for a finished game; a failed post is logged, the game still counts. */
export async function announce(
  i: MessageComponentInteraction,
  puzzle: Puzzle,
  g: Game,
): Promise<void> {
  const number = puzzleNumber(g.date, FIRST_PUZZLE);
  const score = `${g.correct ?? 0}/${puzzle.questions.length}`;
  const content = `<@${g.userId}> scored ${score} on Stat duel #${number} ${tally(puzzle, g.answers)}`;

  await postOrLog(i, "duel", "could not announce a finished game", content);
}
