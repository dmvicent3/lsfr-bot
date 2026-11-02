import type { Game, Standing } from "./types.ts";

function tally(games: Game[]): Standing[] {
  const byUser = new Map<string, Standing>();

  for (const g of games) {
    const s = byUser.get(g.userId) ?? { userId: g.userId, points: 0, solved: 0, lastSolvedAt: 0 };
    s.points += g.points ?? 0;
    s.solved++;
    s.lastSolvedAt = Math.max(s.lastSolvedAt, g.solvedAt ?? 0);
    byUser.set(g.userId, s);
  }

  return [...byUser.values()];
}

/** Points, then more solves, then the earlier last solve, then user ID. */
export const standings = (games: Game[]): Standing[] =>
  tally(games).toSorted(
    (a, b) =>
      b.points - a.points ||
      b.solved - a.solved ||
      a.lastSolvedAt - b.lastSolvedAt ||
      (a.userId < b.userId ? -1 : 1),
  );
