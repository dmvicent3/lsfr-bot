import { reply } from "../../../core/replies.ts";
import { todayPuzzle } from "../play/today.ts";
import { lettersText } from "../render/letters.ts";
import { wordSettings } from "../settings.ts";
import type { CommandCtx } from "./types.ts";

/** Which letters are placed, in the word, untried or out, privately. */
export async function letters({ i, guildId, db, repo, random }: CommandCtx): Promise<void> {
  const settings = wordSettings(db, guildId);
  const puzzle = todayPuzzle(repo, { guildId, settings, now: Date.now(), random });
  const game = repo.games.get(guildId, puzzle.date, i.user.id);

  await reply(i, lettersText({ puzzle, guesses: game?.guesses ?? [] }));
}
