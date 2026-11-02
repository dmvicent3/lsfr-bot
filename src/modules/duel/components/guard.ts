import type { Database } from "bun:sqlite";
import type { MessageComponentInteraction } from "discord.js";
import { puzzleNumber, untilNext } from "../../../core/daily.ts";
import { FIRST_PUZZLE } from "../periods.ts";
import { healed } from "../play/heal.ts";
import type { ViewContext } from "../render/view.ts";
import { duelTimeZone } from "../settings.ts";
import { DuelRepo } from "../store/repo.ts";
import type { Award, Game, Puzzle } from "../types.ts";

export const OUT_OF_DATE = "This question is out of date. Use /duel play.";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

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
  if (!i.guildId || !date || !DATE.test(date)) return null;

  const repo = new DuelRepo(db);
  const puzzle = repo.puzzles.get(i.guildId, date);
  const stored = repo.games.get(i.guildId, date, i.user.id);

  if (!puzzle || !stored) return null;

  const now = Date.now();
  const { game, award } = healed(repo, puzzle, stored, now);
  const view = {
    number: puzzleNumber(date, FIRST_PUZZLE),
    untilNext: untilNext(now, duelTimeZone(db, i.guildId)),
  };

  return { repo, puzzle, game, award, now, view };
}
