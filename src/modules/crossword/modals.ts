import type { ModalHandler } from "../../core/types.ts";
import { answerHandler } from "./components/answer.ts";

/** The crossword answer modal. */
export const crosswordModals = (): ModalHandler[] => [answerHandler];
