import type { ComponentHandler } from "../../../core/types.ts";
import { clearPicks, giveUp, shuffleWords, submit } from "../play/turn.ts";
import { moveHandler } from "./move.ts";
import { newHandler } from "./new.ts";
import { pageHandler } from "./page.ts";
import { pickHandler } from "./pick.ts";

/** Every groups button; `random` shuffles the words and builds New practice puzzles. */
export const groupsComponents = (random: () => number): ComponentHandler[] => [
  pickHandler,
  moveHandler("submit", submit),
  moveHandler("shuffle", (t) => shuffleWords(t, random)),
  moveHandler("clear", clearPicks),
  moveHandler("giveup", giveUp),
  newHandler(random),
  pageHandler,
];
