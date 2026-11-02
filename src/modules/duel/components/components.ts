import type { ComponentHandler } from "../../../core/types.ts";
import { nextHandler } from "./next.ts";
import { pageHandler } from "./page.ts";
import { pickHandler } from "./pick.ts";

/** Every duel button. */
export const duelComponents = (): ComponentHandler[] => [pickHandler, nextHandler, pageHandler];
