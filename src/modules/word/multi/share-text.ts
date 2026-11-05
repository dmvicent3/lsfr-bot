import { puzzleNumber } from "../../../core/daily.ts";
import { FIRST_MULTI_PUZZLE } from "../puzzle-date.ts";
import { boardStates } from "./boards.ts";
import { blocks, gridRows } from "./grid.ts";
import { MODES } from "./modes.ts";
import type { MultiGame } from "./types.ts";

/** The public post for a finished Duo or Quad: squares only, laid out as the board is. */
export function multiShareText(game: MultiGame, words: readonly string[]): string {
  const spec = MODES[game.mode];
  const name = `${spec.name} #${puzzleNumber(game.date, FIRST_MULTI_PUZZLE)}`;
  const heading = game.won
    ? `<@${game.userId}> solved ${name} in ${game.guesses.length}/${spec.attempts}`
    : `<@${game.userId}> missed ${name} — X/${spec.attempts} · ${game.found ?? 0}/${spec.boards} found`;
  const grid = blocks(boardStates(words, game.guesses))
    .map((pair) => gridRows(pair, game.guesses).join("\n"))
    .filter((block) => block !== "");

  return [heading, grid.join("\n\n")].filter((part) => part !== "").join("\n");
}
