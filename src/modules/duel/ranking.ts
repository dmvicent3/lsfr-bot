import { rankGames } from "../../core/ranking.ts";
import type { Game, Standing } from "./types.ts";

/** Ranks finished games only (callers must not pass games in progress): points, then more correct answers, then the earlier last finish, then user ID. */
export const standings = (games: Game[]): Standing[] =>
  rankGames(games, { secondary: (g) => g.correct ?? 0, at: (g) => g.finishedAt }).map(
    ({ secondary, ...s }) => ({ ...s, correct: secondary }),
  );
