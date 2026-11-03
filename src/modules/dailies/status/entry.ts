import type { DailyEntry, EntryBase } from "../types.ts";

/** Not finished: started when the game exists, todo when it does not. */
export const open = (base: EntryBase, started: boolean): DailyEntry => ({
  ...base,
  state: started ? "started" : "todo",
  result: null,
});

export const done = (base: EntryBase, result: string): DailyEntry => ({
  ...base,
  state: "done",
  result,
});

export const pts = (points: number | null): string => `${points ?? 0} pts`;
