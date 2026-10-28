import type { Game, Standing } from "./types.ts";

interface Tally extends Standing {
  attempts: number;
}

function tally(games: Game[]): Tally[] {
  const byUser = new Map<string, Tally>();

  for (const g of games) {
    const t = byUser.get(g.userId) ?? {
      userId: g.userId,
      points: 0,
      wins: 0,
      games: 0,
      avgAttempts: null,
      lastFinishedAt: 0,
      attempts: 0,
    };
    t.points += g.points ?? 0;
    t.games++;
    t.lastFinishedAt = Math.max(t.lastFinishedAt, g.finishedAt ?? 0);

    if (g.won) {
      t.wins++;
      t.attempts += g.guesses.length;
    }

    byUser.set(g.userId, t);
  }

  return [...byUser.values()];
}

/** Equal wins means both have an average or neither does, so null only meets null. */
const byAttempts = (a: Standing, b: Standing): number =>
  (a.avgAttempts ?? 0) - (b.avgAttempts ?? 0);

/** Points, then wins, then fewer attempts per win, then the earlier last finish, then user ID. */
export function standings(games: Game[]): Standing[] {
  return tally(games)
    .map(({ attempts, ...s }) => ({ ...s, avgAttempts: s.wins > 0 ? attempts / s.wins : null }))
    .toSorted(
      (a, b) =>
        b.points - a.points ||
        b.wins - a.wins ||
        byAttempts(a, b) ||
        a.lastFinishedAt - b.lastFinishedAt ||
        (a.userId < b.userId ? -1 : 1),
    );
}

/** 1-based rank, null when the player has no games in the list. */
export function rankOf(list: Standing[], userId: string): number | null {
  const i = list.findIndex((s) => s.userId === userId);

  return i < 0 ? null : i + 1;
}
