import type { ComponentHandler } from "../../../core/types.ts";
import { predictionComponents } from "./predictions.ts";
import { reminderComponents } from "./reminders.ts";
import { unfollow } from "./unfollow.ts";

export const motorsportComponents: ComponentHandler[] = [
  ...reminderComponents,
  ...predictionComponents,
  unfollow,
];
