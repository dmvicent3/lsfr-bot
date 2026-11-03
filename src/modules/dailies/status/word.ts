import type { Game } from "../../word/types.ts";
import type { DailyEntry, EntryBase } from "../types.ts";
import { done, open, pts } from "./entry.ts";

export function wordEntry(game: Game | null, base: EntryBase): DailyEntry {
  if (game?.finishedAt == null) return open(base, game !== null);

  return done(base, game.won ? pts(game.points) : "lost");
}
