import { LEVELS, type Level } from "../types.ts";

/** The difficulty option is a required choice, so the fallback only guards against drift. */
export const toLevel = (s: string): Level => LEVELS.find((l) => l === s) ?? "easy";
