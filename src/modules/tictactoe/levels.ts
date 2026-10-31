import type { Difficulty } from "./types.ts";

const LEVELS: readonly string[] = ["easy", "normal", "hard"] satisfies Difficulty[];

const isLevel = (s: string): s is Difficulty => LEVELS.includes(s);

/** A stored or chosen level; anything else (or nothing) is normal. */
export const levelOf = (s: string | null): Difficulty => (s && isLevel(s) ? s : "normal");
