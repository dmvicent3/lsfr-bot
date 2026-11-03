import type { ModalHandler } from "../../core/types.ts";
import { answerHandler } from "./components/answer.ts";
import { cellWordHandler } from "./components/cell-word.ts";

/** The crossword modals: one clue's answer, and the words through a square. */
export const crosswordModals = (): ModalHandler[] => [answerHandler, cellWordHandler];
