import { puzzleNumber, untilNext } from "../puzzle-date.ts";
import { MAX_ATTEMPTS } from "../scoring.ts";
import type { Award, Game, Puzzle } from "../types.ts";
import { boardLines } from "./board.ts";

function finishedLines(game: Game, v: { puzzle: Puzzle; award: Award | null }): string[] {
  const points = v.award
    ? `+${v.award.points} pts (${v.award.parts.join(", ")})`
    : `+${game.points ?? 0} pts`;

  return [`The word was **${v.puzzle.word.toUpperCase()}**.`, points];
}

/** The player's private view: board, then attempts left or the result. */
export function gameText(v: {
  puzzle: Puzzle;
  game: Game | null;
  award: Award | null;
  now: number;
  timeZone: string;
}): string {
  const heading = `**Word #${puzzleNumber(v.puzzle.date)}** · ${v.puzzle.length} letters`;
  const guesses = v.game?.guesses ?? [];
  const board = guesses.length > 0 ? [boardLines(guesses, v.puzzle.word)] : [];

  if (v.game?.finishedAt) {
    const wait = `Next puzzle in ${untilNext(v.now, v.timeZone)}.`;

    return [heading, ...board, ...finishedLines(v.game, v), wait].join("\n");
  }

  const left = `Attempts left: ${MAX_ATTEMPTS - guesses.length}.`;
  const hint = guesses.length === 0 ? " Guess with `/word guess`." : "";

  return [heading, ...board, left + hint].join("\n");
}
