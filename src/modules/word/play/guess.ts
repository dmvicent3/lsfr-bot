import type { Database } from "bun:sqlite";
import { feedback } from "../feedback.ts";
import { award, MAX_ATTEMPTS } from "../scoring.ts";
import type { WordRepo } from "../store/repo.ts";
import { nextStreak } from "../streak.ts";
import type { Game, GuessResult, Puzzle } from "../types.ts";
import { checkGuess } from "../validate.ts";

interface GuessInput {
  puzzle: Puzzle;
  userId: string;
  text: string;
  accepted: ReadonlySet<string>;
  now: number;
}

/** Thrown inside the transaction when another call finished the game first. */
class AlreadyFinished extends Error {}

const openGame = (g: GuessInput): Game => ({
  guildId: g.puzzle.guildId,
  date: g.puzzle.date,
  userId: g.userId,
  guesses: [],
  won: null,
  points: null,
  streak: null,
  finishedAt: null,
});

/** The finishing write: streak from the player's previous game, then the award. */
function finish(repo: WordRepo, game: Game, won: boolean, now: number): GuessResult {
  const last = repo.games.lastFinished(game.guildId, game.userId, game.date);
  const streak = nextStreak(last, game.date, won);
  const points = award(won, game.guesses.length, streak);
  const done = { ...game, won, points: points.points, streak, finishedAt: now };

  if (!repo.games.finish(done)) throw new AlreadyFinished();

  return { kind: "finished", game: done, award: points };
}

function apply(repo: WordRepo, g: GuessInput): GuessResult {
  const { guildId, date, length, word } = g.puzzle;
  const game = repo.games.get(guildId, date, g.userId) ?? openGame(g);
  const finished = game.finishedAt !== null;
  const check = checkGuess({ ...g, length, guesses: game.guesses, finished });

  if (!check.ok) return { kind: "refused", reason: check.reason };

  const next = { ...game, guesses: [...game.guesses, check.word] };
  const won = feedback(check.word, word).every((m) => m === "hit");

  if (won || next.guesses.length >= MAX_ATTEMPTS) return finish(repo, next, won, g.now);

  repo.games.saveGuesses(next);

  return { kind: "open", game: next };
}

/** One guess, read to write in one transaction, so a game finishes (and scores) once. */
export function submitGuess(db: Database, repo: WordRepo, g: GuessInput): GuessResult {
  try {
    return db.transaction(() => apply(repo, g))();
  } catch (err) {
    if (err instanceof AlreadyFinished) return { kind: "refused", reason: "finished" };

    throw err;
  }
}
