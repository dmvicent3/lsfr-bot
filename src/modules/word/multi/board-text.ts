import { puzzleNumber, untilNext } from "../../../core/daily.ts";
import { FIRST_MULTI_PUZZLE } from "../puzzle-date.ts";
import { boardStates } from "./boards.ts";
import { blocks, gridRows } from "./grid.ts";
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

const hint = (mode: string): string =>
  `Every guess counts on every board. Guess with \`/${mode} guess\`.`;

/** The guess as unspaced capitals: the squares beside it take the width. */
const label = (g: string): string => `\`${g.toUpperCase()}\``;

/** A board's column heading: its number, ✅ once solved, ❌ and the word once lost. */
function title(b: BoardState, k: number, finished: boolean): string {
  const mark = b.solvedAt === null ? "" : " ✅";
  const lost = finished && b.solvedAt === null ? ` ❌ **${b.word.toUpperCase()}**` : "";

  return `**Board ${k + 1}**${mark}${lost}`;
}

/** The boards two by two: a heading line naming the columns, then each guess once. */
function grid(boards: BoardState[], guesses: string[], finished: boolean): string {
  const titled = boards.map((b, k) => ({ b, t: title(b, k, finished) }));

  return blocks(titled)
    .map((pair) => {
      const head = pair.map((x) => x.t).join(" │ ");

      return [
        head,
        ...gridRows(
          pair.map((x) => x.b),
          guesses,
          label,
        ),
      ].join("\n");
    })
    .join("\n\n");
}

function heading(v: MultiTextView, guesses: string[]): string {
  const spec = MODES[v.puzzle.mode];
  const name = `**${spec.name} #${puzzleNumber(v.puzzle.date, FIRST_MULTI_PUZZLE)}**`;

  if (v.game?.finishedAt) return `${name} · ${v.game.found ?? 0}/${spec.boards} solved`;

  return `${name} · attempts left ${spec.attempts - guesses.length}`;
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

/** The player's private board message: the boards side by side, then the result once finished. */
export function multiText(v: MultiTextView): string {
  const guesses = v.game?.guesses ?? [];
  const finished = Boolean(v.game?.finishedAt);
  const boards = boardStates(v.puzzle.words, guesses);
  const body =
    guesses.length > 0 || finished ? grid(boards, guesses, finished) : hint(v.puzzle.mode);
  const tail = v.game?.finishedAt ? ["", ...resultLines(v.game, v)] : [];

  return [heading(v, guesses), body, ...tail].join("\n");
}
