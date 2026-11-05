import type { Mode, ModeSpec } from "./types.ts";

export const MODES: Record<Mode, ModeSpec> = {
  duo: { name: "Word Duo", blurb: "two words", boards: 2, attempts: 7 },
  quad: { name: "Word Quad", blurb: "four words", boards: 4, attempts: 9 },
};

export const MODE_LIST: readonly Mode[] = ["duo", "quad"];

/** The mode an ID part or option names; null when it names none. */
export const modeOf = (s: string | null | undefined): Mode | null =>
  MODE_LIST.find((m) => m === s) ?? null;
