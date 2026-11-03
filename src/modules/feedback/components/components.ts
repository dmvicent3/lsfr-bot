import type { ComponentHandler } from "../../../core/types.ts";
import { editHandler } from "./edit.ts";
import { removeHandler } from "./remove.ts";

/** The buttons on a public feedback post. */
export const feedbackComponents = (): ComponentHandler[] => [editHandler, removeHandler];
