import { nextStreak } from "../../../core/daily.ts";
import type { GameStore } from "../store/games.ts";
import type { Game } from "../types.ts";
import { award } from "./scoring.ts";
import type { Award } from "./types.ts";

/** What a just-finished daily scored; a loss or give-up has no award. */
export function scoreDaily(store: GameStore, g: Game): { game: Game; award: Award | null } {
  const date = g.date ?? "";
  const won = g.result === "won";
  const last = store.lastDailyBefore(g.guildId, g.playerId, date);
  const prev = last?.date
    ? { date: last.date, won: last.result === "won", streak: last.streak ?? 0 }
    : null;
  const streak = nextStreak(prev, date, won);

  if (!won || !g.level) return { game: { ...g, points: 0, streak }, award: null };

  const a = award(g.level, g.clicks, g.bbbv ?? 0, streak);

  return { game: { ...g, points: a.points, streak }, award: a };
}
