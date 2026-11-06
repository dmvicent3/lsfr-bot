import type { ComponentHandler } from "../../../core/types.ts";
import { chip } from "./chips.ts";
import { predictionComponents } from "./predictions.ts";
import { reminderComponents } from "./reminders.ts";
import { unfollow } from "./unfollow.ts";

export const motorsportComponents: ComponentHandler[] = [
  ...reminderComponents,
  ...predictionComponents,
  chip,
  unfollow,
];
