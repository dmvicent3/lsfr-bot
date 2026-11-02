import { currentStreak } from "../../core/daily.ts";
import type { Game, Level, PlayerStats } from "./types.ts";

const sum = (ns: number[]): number => ns.reduce((a, b) => a + b, 0);

const perLevel = <T>(f: (level: Level) => T): Record<Level, T> => ({
  easy: f("easy"),
  medium: f("medium"),
  hard: f("hard"),
});

/** Solve times in ms for one level. */
const times = (games: Game[], level: Level): number[] =>
  games.flatMap((g) =>
    g.level === level && g.solvedAt !== null ? [g.solvedAt - g.startedAt] : [],
  );

/** Totals over one player's solved daily games, oldest first. */
export function playerStats(all: Game[], today: string): PlayerStats {
  const games = all.filter((g) => g.solvedAt !== null);
  const last = games.at(-1);
  const at = (level: Level): number[] => times(games, level);

  return {
    points: sum(games.map((g) => g.points ?? 0)),
    solved: perLevel((l) => at(l).length),
    bestMs: perLevel((l) => (at(l).length > 0 ? Math.min(...at(l)) : null)),
    avgMs: perLevel((l) => (at(l).length > 0 ? sum(at(l)) / at(l).length : null)),
    currentStreak: currentStreak(
      last ? { date: last.date, won: true, streak: last.streak ?? 0 } : null,
      today,
    ),
    longestStreak: Math.max(0, ...games.map((g) => g.streak ?? 0)),
  };
}
