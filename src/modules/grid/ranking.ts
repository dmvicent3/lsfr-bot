import type { Standing } from "./ranking-types.ts";
import type { Game } from "./types.ts";

function tally(games: Game[]): Standing[] {
  const byUser = new Map<string, Standing>();

  for (const g of games) {
    const s = byUser.get(g.userId) ?? { userId: g.userId, points: 0, filled: 0, lastFinishedAt: 0 };
    s.points += g.points ?? 0;
    s.filled += g.filled ?? 0;
    s.lastFinishedAt = Math.max(s.lastFinishedAt, g.finishedAt ?? 0);
    byUser.set(g.userId, s);
  }

  return [...byUser.values()];
}

/** Ranks finished games only: points, then more cells filled, then the earlier last finish, then user ID. */
export const standings = (games: Game[]): Standing[] =>
  tally(games).toSorted(
    (a, b) =>
      b.points - a.points ||
      b.filled - a.filled ||
      a.lastFinishedAt - b.lastFinishedAt ||
      (a.userId < b.userId ? -1 : 1),
  );
