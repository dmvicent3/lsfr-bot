import { reply } from "../../../core/replies.ts";
import { todayPuzzle } from "../play/today.ts";
import { gameText } from "../render/game.ts";
import { wordSettings } from "../settings.ts";
import type { CommandCtx } from "./types.ts";

/** Today's board, private: resume or look back. */
export async function play({ i, guildId, db, repo, random }: CommandCtx): Promise<void> {
  const settings = wordSettings(db, guildId);
  const now = Date.now();
  const puzzle = todayPuzzle(repo, { guildId, settings, now, random });
  const game = repo.games.get(guildId, puzzle.date, i.user.id);

  await reply(i, gameText({ puzzle, game, award: null, now, timeZone: settings.timeZone }));
}
