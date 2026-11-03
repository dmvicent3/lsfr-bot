import type { Database } from "bun:sqlite";
import type { MessageComponentInteraction } from "discord.js";
import { dailyLookup, dayOf } from "../../../core/daily-guard.ts";
import { FIRST_PUZZLE } from "../periods.ts";
import { healed } from "../play/heal.ts";
import type { ViewContext } from "../render/view.ts";
import { duelTimeZone } from "../settings.ts";
import { DuelRepo } from "../store/repo.ts";
import type { Award, Game, Puzzle } from "../types.ts";

export const OUT_OF_DATE = "This question is out of date. Use /duel play.";

export interface Session {
  repo: DuelRepo;
  puzzle: Puzzle;
  game: Game;
  /** Set when loading finished a game that had every answer but no finish. */
  award: Award | null;
  now: number;
  view: ViewContext;
}

/**
 * The puzzle and the clicker's own game for the date in a custom ID; null when either is missing.
 * A game with every answer but no finish is finished here, so it never renders as finished unsaved.
 * So this may write (the heal), and the session carries the award it produced.
 */
export function load(
  i: MessageComponentInteraction,
  db: Database,
  date: string | undefined,
): Session | null {
  if (!i.guildId || !date) return null;

  const repo = new DuelRepo(db);
  const found = dailyLookup(repo, i.guildId, date, i.user.id);

  if (!found) return null;

  const now = Date.now();
  const { puzzle } = found;
  const { game, award } = healed(repo, puzzle, found.game, now);
  const view = dayOf(date, FIRST_PUZZLE, now, duelTimeZone(db, i.guildId));

  return { repo, puzzle, game, award, now, view };
}
