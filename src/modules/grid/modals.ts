import { readSnapshot } from "../../core/countries/load.ts";
import type { ModalHandler } from "../../core/types.ts";
import { answerHandler } from "./components/answer.ts";
import type { Source } from "./components/guard.ts";

/** The grid answer modal. */
export const gridModals = (source: Source = () => readSnapshot()): ModalHandler[] => [
  answerHandler(source),
];
