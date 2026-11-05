import { puzzleNumber, untilNext } from "../../../core/daily.ts";
import { FIRST_MULTI_PUZZLE } from "../puzzle-date.ts";
import { boardLines } from "../render/board.ts";
import { boardStates } from "./boards.ts";
import { MODES } from "./modes.ts";
import { recap } from "./scoring.ts";
import type { BoardState, MultiGame, MultiPuzzle } from "./types.ts";

/** What the board message shows: the puzzle, the player's game (null before a guess), the time. */
export interface MultiTextView {
  puzzle: MultiPuzzle;
  game: MultiGame | null;
  now: number;
  timeZone: string;
}

const HINT = "Every guess counts on every board. Press **Guess** to play.";

/** One board: its number, ✅ and the solving attempt, or ❌ and the word once lost; its guesses. */
function boardBlock(b: BoardState, k: number, finished: boolean): string {
  const mark = b.solvedAt === null ? "" : ` ✅ attempt ${b.solvedAt}`;
  const lost = finished && b.solvedAt === null ? ` ❌ **${b.word.toUpperCase()}**` : "";
  const lines = b.guesses.length > 0 ? [boardLines(b.guesses, b.word)] : [];

  return [`**Board ${k + 1}**${mark}${lost}`, ...lines].join("\n");
}

function heading(v: MultiTextView, guesses: string[]): string {
  const spec = MODES[v.puzzle.mode];
  const title = `**${spec.name} #${puzzleNumber(v.puzzle.date, FIRST_MULTI_PUZZLE)}**`;

  if (v.game?.finishedAt) return `${title} · ${v.game.found ?? 0}/${spec.boards} solved`;

  return `${title} · attempts left ${spec.attempts - guesses.length}`;
}

/** The result once finished: how it ended, the points with their parts, the wait. */
function resultLines(game: MultiGame, v: MultiTextView): string[] {
  const spec = MODES[game.mode];
  const award = recap(game);
  const ended = game.guesses.length < spec.attempts ? "You gave up." : "Out of attempts.";

  return [
    game.won ? `All ${spec.boards} solved!` : ended,
    `+${award.points} pts (${award.parts.join(", ")})`,
    `Next puzzle in ${untilNext(v.now, v.timeZone)}.`,
  ];
}

/** The player's private board message: every board stacked, then the result once finished. */
export function multiText(v: MultiTextView): string {
  const guesses = v.game?.guesses ?? [];
  const finished = Boolean(v.game?.finishedAt);
  const boards = boardStates(v.puzzle.words, guesses).map((b, k) => boardBlock(b, k, finished));
  const body = guesses.length > 0 || finished ? boards.join("\n\n") : HINT;
  const tail = v.game?.finishedAt ? ["", ...resultLines(v.game, v)] : [];

  return [heading(v, guesses), body, ...tail].join("\n");
}
