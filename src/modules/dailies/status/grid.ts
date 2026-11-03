import { CELLS } from "../../grid/scoring.ts";
import type { Game } from "../../grid/types.ts";
import type { DailyEntry, EntryBase } from "../types.ts";
import { done, open, pts } from "./entry.ts";

export function gridEntry(game: Game | null, base: EntryBase): DailyEntry {
  if (game?.finishedAt == null) return open(base, game !== null);

  return done(base, `${game.filled ?? 0}/${CELLS} · ${pts(game.points)}`);
}
