import type { GridRepo } from "../store/repo.ts";
import type { Award, Game } from "../types.ts";
import { finish } from "./finish.ts";

/** Ends the day game with what is filled so far. */
export const giveUp = (repo: GridRepo, g: Game, now: number): { game: Game; award: Award | null } =>
  finish(repo, g, now);
