import type { Controls, Preset } from "../types.ts";

const PRESET_NAMES: Record<string, Preset> = {
  beginner: "beginner",
  intermediate: "intermediate",
  expert: "expert",
};

const CONTROLS: Record<string, Controls> = { menus: "menus", arrows: "arrows", both: "both" };

/** The difficulty option; null when not given. */
export const toPreset = (s: string | null): Preset | null => PRESET_NAMES[s ?? ""] ?? null;

/** The controls option; menus when not given. */
export const toControls = (s: string | null): Controls => CONTROLS[s ?? ""] ?? "menus";
