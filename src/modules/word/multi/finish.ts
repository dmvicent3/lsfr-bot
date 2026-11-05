import { nextStreak } from "../../../core/daily.ts";
import { AlreadyFinished } from "../play/once.ts";
import type { WordRepo } from "../store/repo.ts";
import { foundCount } from "./boards.ts";
import { recap } from "./scoring.ts";
import type { MultiGame, MultiPuzzle, MultiResult } from "./types.ts";

/**
 * The finishing write: a win only when every board is solved, the streak from the player's
 * previous game in this mode, then the award. Throws AlreadyFinished when another call won.
 */
export function finishMulti(
  repo: WordRepo,
  puzzle: MultiPuzzle,
  game: MultiGame,
  now: number,
): MultiResult {
  const found = foundCount(puzzle.words, game.guesses);
  const won = found === puzzle.words.length;
  const streak = nextStreak(repo.multiGames.lastFinished(game), game.date, won);
  const ended = { ...game, won, found, streak, finishedAt: now };
  const award = recap(ended);
  const done = { ...ended, points: award.points };

  if (!repo.multiGames.finish(done)) throw new AlreadyFinished();

  return { kind: "finished", game: done, award };
}
