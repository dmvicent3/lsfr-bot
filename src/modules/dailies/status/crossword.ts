import type { Game } from "../../crossword/types.ts";
import type { DailyEntry, EntryBase } from "../types.ts";
import { done, open, pts } from "./entry.ts";

export function crosswordEntry(game: Game | null, base: EntryBase): DailyEntry {
  if (game?.finishedAt == null) return open(base, game !== null);

  return done(base, game.solved === false ? "gave up" : pts(game.points));
}
