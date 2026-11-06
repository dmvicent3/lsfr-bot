import type { Game } from "../../minesweeper/types.ts";
import type { DailyEntry, EntryBase } from "../types.ts";
import { done, open, pts } from "./entry.ts";

/** Finished: points on a win, what ended it otherwise. */
export function minesweeperEntry(game: Game | null, base: EntryBase): DailyEntry {
  if (game?.finishedAt == null) return open(base, game !== null);

  return done(base, game.result === "won" ? pts(game.points) : "💥 lost");
}
