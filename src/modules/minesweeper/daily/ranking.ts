import { rankGames } from "../../../core/ranking.ts";
import type { Game } from "../types.ts";
import type { Standing } from "./types.ts";

/** Points, then more wins, then the earlier last finish, then user ID. */
export const standings = (games: Game[]): Standing[] =>
  rankGames(
    games.map((g) => ({ ...g, userId: g.playerId })),
    { secondary: (g) => (g.result === "won" ? 1 : 0), at: (g) => g.finishedAt },
  ).map(({ secondary, lastFinishedAt: _last, ...s }) => ({ ...s, wins: secondary }));
