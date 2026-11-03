import { QUESTIONS } from "../../duel/questions/bands.ts";
import type { Game } from "../../duel/types.ts";
import type { DailyEntry, EntryBase } from "../types.ts";
import { done, open, pts } from "./entry.ts";

export function duelEntry(game: Game | null, base: EntryBase): DailyEntry {
  if (game?.finishedAt == null) return open(base, game !== null);

  return done(base, `${game.correct ?? 0}/${QUESTIONS} · ${pts(game.points)}`);
}
