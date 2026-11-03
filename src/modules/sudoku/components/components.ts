import type { ComponentHandler } from "../../../core/types.ts";
import { checkHandler } from "./check.ts";
import { clearHandler } from "./clear.ts";
import { modeHandler } from "./mode.ts";
import { moveHandler } from "./move.ts";
import { newHandler } from "./new.ts";
import { pageHandler } from "./page.ts";
import { putHandler } from "./put.ts";

/** Every sudoku button; `new` needs the generator's randomness. */
export const sudokuComponents = (random: () => number): ComponentHandler[] => [
  moveHandler,
  putHandler,
  modeHandler,
  clearHandler,
  checkHandler,
  newHandler(random),
  pageHandler,
];
