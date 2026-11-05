import { MAX_MISTAKES } from "../play/guess.ts";
import type { Group, Level } from "../types.ts";

/** A group's colour by difficulty, easiest first. */
export const COLOURS: Record<Level, string> = { 0: "🟨", 1: "🟩", 2: "🟦", 3: "🟪" };

/** `🟨 FISH — BASS · SALMON · TROUT · PIKE` */
export const groupLine = (g: Group): string =>
  `${COLOURS[g.level]} **${g.name.toUpperCase()}** — ${g.words.map((w) => w.toUpperCase()).join(" · ")}`;

/** `●●●○`: one filled dot per mistake left. */
export const mistakesLeft = (mistakes: number): string => {
  const left = Math.max(0, MAX_MISTAKES - mistakes);

  return "●".repeat(left) + "○".repeat(MAX_MISTAKES - left);
};
