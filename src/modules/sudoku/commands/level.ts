import type { Level } from "../types.ts";

const LEVELS: Record<string, Level> = { easy: "easy", medium: "medium", hard: "hard" };

/** The difficulty option is a required choice, so the fallback only guards against drift. */
export const toLevel = (s: string): Level => LEVELS[s] ?? "easy";
