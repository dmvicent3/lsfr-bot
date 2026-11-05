import type { Database } from "bun:sqlite";
import { once } from "../play/once.ts";
import type { WordRepo } from "../store/repo.ts";
import { checkGuess } from "../validate.ts";
import { isOver } from "./boards.ts";
import { finishMulti } from "./finish.ts";
import { gameOn } from "./game.ts";
import { MODES } from "./modes.ts";
import type { MultiPuzzle, MultiResult } from "./types.ts";

interface MultiGuessInput {
  puzzle: MultiPuzzle;
  userId: string;
  text: string;
  accepted: ReadonlySet<string>;
  now: number;
}

function apply(repo: WordRepo, g: MultiGuessInput): MultiResult {
  const { puzzle } = g;
  const game = gameOn(repo.multiGames, puzzle, g.userId);
  const finished = game.finishedAt !== null;
  const check = checkGuess({ ...g, length: puzzle.length, guesses: game.guesses, finished });

  if (!check.ok) return { kind: "refused", reason: check.reason };

  const next = { ...game, guesses: [...game.guesses, check.word] };

  if (isOver(puzzle.words, next.guesses, MODES[puzzle.mode].attempts)) {
    return finishMulti(repo, puzzle, next, g.now);
  }

  repo.multiGames.saveGuesses(next);

  return { kind: "open", game: next };
}

/** One guess on every unsolved board, checked as a classic guess is; finishes once. */
export function submitMultiGuess(db: Database, repo: WordRepo, g: MultiGuessInput): MultiResult {
  return once(
    db,
    () => apply(repo, g),
    () => ({ kind: "refused", reason: "finished" }),
  );
}
