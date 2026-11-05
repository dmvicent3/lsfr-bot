import type { Database } from "bun:sqlite";
import { once } from "../play/once.ts";
import type { WordRepo } from "../store/repo.ts";
import { finishMulti } from "./finish.ts";
import { gameOn } from "./game.ts";
import type { MultiPuzzle, MultiResult } from "./types.ts";

const FINISHED: MultiResult = { kind: "refused", reason: "finished" };

/** Ends the game as a loss, keeping 50 a word already found; a finished game stays as it is. */
export function giveUpMulti(
  db: Database,
  repo: WordRepo,
  g: { puzzle: MultiPuzzle; userId: string; now: number },
): MultiResult {
  const move = (): MultiResult => {
    const game = gameOn(repo.multiGames, g.puzzle, g.userId);

    return game.finishedAt === null ? finishMulti(repo, g.puzzle, game, g.now) : FINISHED;
  };

  return once(db, move, () => FINISHED);
}
