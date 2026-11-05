import type { ComponentHandler } from "../../../core/types.ts";
import { load } from "./guard.ts";
import { refresh } from "./show.ts";

/**
 * `crossword:clues:<date|practice>:<stamp>:<menu>:<tag>`: a paged board's Across / Down or page
 * button; the board re-renders on the menu its id carries.
 */
export const cluesHandler: ComponentHandler = {
  id: "crossword:clues",
  handle: (i, args, ctx) => refresh(i, load(i, ctx.db, args)),
};
