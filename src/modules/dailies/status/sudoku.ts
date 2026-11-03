import type { Game } from "../../sudoku/types.ts";
import type { DailyEntry, EntryBase } from "../types.ts";
import { done, open, pts } from "./entry.ts";

export function sudokuEntry(game: Game | null, base: EntryBase): DailyEntry {
  if (game?.solvedAt == null) return open(base, game !== null);

  return done(base, pts(game.points));
}
