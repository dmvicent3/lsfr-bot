import { readSnapshot } from "../../../core/countries/load.ts";
import type { ComponentHandler } from "../../../core/types.ts";
import { cellHandler } from "./cell.ts";
import { giveUpHandler } from "./give-up.ts";
import type { Source } from "./guard.ts";
import { newHandler } from "./new.ts";
import { pageHandler } from "./page.ts";

/** Every grid button. */
export const gridComponents = (source: Source = () => readSnapshot()): ComponentHandler[] => [
  cellHandler(source),
  giveUpHandler(source),
  newHandler(source),
  pageHandler,
];
