import { MAX_GUESS, MIN_GUESS } from "../play/validate.ts";
import { earlierLine, guessRow, latest } from "./lines.ts";
import { guessCount, resultLines } from "./result.ts";
import { CAP, JOINED, SQUARE } from "./squares.ts";
import type { BoardView } from "./types.ts";

/** Discord's limit on a message's text; the board keeps under it however many guesses. */
export const LIMIT = 2000;

/** Room kept for the line counting the guesses left out. */
const EARLIER_ROOM = 40;

/** How to read the board, shown until the first guess. */
export const HOW_TO = [
  `Find the hidden word: 4–10 letters, its length kept secret. Guess any word of ${MIN_GUESS}–${MAX_GUESS} letters, as often as you like.`,
  `${SQUARE.green} in the word, in the same order as your other greens · ${SQUARE.yellow} in the word, elsewhere · ${SQUARE.dark} not in the word (or no copy left)`,
  `${JOINED} greens side by side in the word too · ${CAP} your guess starts or ends with the word's first or last letter`,
].join("\n");

/** "Snake #3", or "Practice snake". */
export const roundName = (number: number | null): string =>
  number === null ? "Practice snake" : `Snake #${number}`;

/** The first line: the game's name and the guess count. */
export const header = (v: BoardView): string =>
  `**${roundName(v.number)}** · ${guessCount(v.guesses.length)}`;

/** Where guesses go: the daily's command, or the same with the practice option. */
export const guessLine = (v: Pick<BoardView, "number">): string =>
  v.number === null
    ? "Guess with `/snake guess word: practice:True`."
    : "Guess with `/snake guess word:`.";

/** What follows the rows: the how-to until the first guess, then the result once finished. */
export function body(v: BoardView): string {
  const intro = v.guesses.length === 0 && !v.finished ? [HOW_TO, guessLine(v)] : [];

  return [...intro, ...resultLines(v)].join("\n");
}

/** Everything under the header: the newest rows that fit the limit, the rest counted, then the body. */
export function boardText(v: BoardView): string {
  const under = body(v);
  const room = LIMIT - header(v).length - under.length - EARLIER_ROOM - 2;
  const { shown, earlier } = latest(
    v.guesses.map((g) => guessRow(g, v.answer)),
    room,
  );
  const head = earlier > 0 ? [earlierLine(earlier)] : [];

  return [...head, ...shown, ...(under ? [under] : [])].join("\n");
}
