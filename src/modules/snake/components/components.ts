import type { ComponentHandler } from "../../../core/types.ts";
import { giveUpHandler } from "./give-up.ts";
import { guessHandler } from "./guess.ts";
import { newHandler } from "./new.ts";
import { pageHandler } from "./page.ts";

/** Every snake button; `random` picks the word of a New practice round. */
export const snakeComponents = (random: () => number): ComponentHandler[] => [
  guessHandler,
  giveUpHandler,
  newHandler(random),
  pageHandler,
];
