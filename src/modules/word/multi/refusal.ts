import { puzzleNumber } from "../../../core/daily.ts";
import { FIRST_MULTI_PUZZLE } from "../puzzle-date.ts";
import type { RefusedReason } from "../types.ts";
import { refusalText } from "../validate.ts";
import { MODES } from "./modes.ts";
import type { MultiPuzzle } from "./types.ts";

/** Why a Duo or Quad guess didn't count, worded as classic's refusals with the mode's name. */
export const multiRefusal = (reason: RefusedReason, p: MultiPuzzle, wait: string): string =>
  refusalText(reason, {
    name: MODES[p.mode].name,
    length: p.length,
    number: puzzleNumber(p.date, FIRST_MULTI_PUZZLE),
    wait,
  });
