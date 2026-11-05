import { MODES } from "../../word/multi/modes.ts";
import type { MultiGame } from "../../word/multi/types.ts";
import type { DailyEntry, EntryBase } from "../types.ts";
import { done, open, pts } from "./entry.ts";

/** Done shows the words found out of the boards, and the points. */
export function wordMultiEntry(game: MultiGame | null, base: EntryBase): DailyEntry {
  if (game?.finishedAt == null) return open(base, game !== null);

  return done(base, `${game.found ?? 0}/${MODES[game.mode].boards} · ${pts(game.points)}`);
}
