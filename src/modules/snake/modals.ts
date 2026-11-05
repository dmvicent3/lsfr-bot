import type { ModalHandler } from "../../core/types.ts";
import { answerHandler } from "./components/answer.ts";

/** The snake modal: the typed guess. */
export const snakeModals = (): ModalHandler[] => [answerHandler];
