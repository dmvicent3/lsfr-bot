import { rankGames } from "../../core/ranking.ts";
import type { Standing } from "./ranking-types.ts";
import type { Game } from "./types.ts";

/** Ranks finished games only: points, then more cells filled, then the earlier last finish, then user ID. */
export const standings = (games: Game[]): Standing[] =>
  rankGames(games, { secondary: (g) => g.filled ?? 0, at: (g) => g.finishedAt }).map(
    ({ secondary, ...s }) => ({ ...s, filled: secondary }),
  );
