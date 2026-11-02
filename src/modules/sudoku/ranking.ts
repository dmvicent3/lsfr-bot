import { rankGames } from "../../core/ranking.ts";
import type { Game, Standing } from "./types.ts";

/** Points, then more solves, then the earlier last solve, then user ID. */
export const standings = (games: Game[]): Standing[] =>
  rankGames(games, { secondary: () => 1, at: (g) => g.solvedAt }).map(
    ({ secondary, lastFinishedAt, ...s }) => ({
      ...s,
      solved: secondary,
      lastSolvedAt: lastFinishedAt,
    }),
  );
