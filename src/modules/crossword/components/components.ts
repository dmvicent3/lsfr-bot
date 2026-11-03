import type { ComponentHandler } from "../../../core/types.ts";
import type { Ask } from "../play/make.ts";
import { checkHandler } from "./check.ts";
import { giveUpHandler } from "./give-up.ts";
import { newHandler } from "./new.ts";
import { pageHandler } from "./page.ts";
import { pickHandler } from "./pick.ts";
import { revealHandler } from "./reveal.ts";

/** Every crossword button and select; `ask` writes the clues of a New puzzle. */
export const crosswordComponents = (ask: Ask | null, random: () => number): ComponentHandler[] => [
  pickHandler,
  checkHandler,
  revealHandler,
  giveUpHandler,
  newHandler(ask, random),
  pageHandler,
];
