import type { ModalHandler } from "../../../core/types.ts";
import { giveHandler } from "./give.ts";
import { saveHandler } from "./save.ts";

/** The feedback forms: new feedback, and an edit of one. */
export const feedbackModals = (): ModalHandler[] => [giveHandler, saveHandler];
