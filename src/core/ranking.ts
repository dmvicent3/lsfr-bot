/** A finished daily game as ranking needs it. */
export interface Ranked {
  userId: string;
  points: number | null;
}

export interface Tallied {
  userId: string;
  points: number;
  /** The module's tie-break score, summed over the games. */
  secondary: number;
  lastFinishedAt: number;
}

export interface RankBy<G> {
  /** What a game adds to the tie-break total. */
  secondary: (g: G) => number;
  /** When the game finished. */
  at: (g: G) => number | null;
}

function tally<G extends Ranked>(games: G[], by: RankBy<G>): Tallied[] {
  const byUser = new Map<string, Tallied>();

  for (const g of games) {
    const s = byUser.get(g.userId) ?? {
      userId: g.userId,
      points: 0,
      secondary: 0,
      lastFinishedAt: 0,
    };
    s.points += g.points ?? 0;
    s.secondary += by.secondary(g);
    s.lastFinishedAt = Math.max(s.lastFinishedAt, by.at(g) ?? 0);
    byUser.set(g.userId, s);
  }

  return [...byUser.values()];
}

/** Points, then a larger secondary total, then the earlier last finish, then user ID. */
export const rankGames = <G extends Ranked>(games: G[], by: RankBy<G>): Tallied[] =>
  tally(games, by).toSorted(
    (a, b) =>
      b.points - a.points ||
      b.secondary - a.secondary ||
      a.lastFinishedAt - b.lastFinishedAt ||
      (a.userId < b.userId ? -1 : 1),
  );
