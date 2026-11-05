import type { Database } from "bun:sqlite";
import {
  type MessageComponentInteraction,
  MessageFlags,
  type ModalSubmitInteraction,
} from "discord.js";
import { log } from "../../../core/log.ts";
import { dateIn } from "../../../core/zoned.ts";
import { MODES, modeOf } from "../multi/modes.ts";
import type { MultiGame, MultiPuzzle } from "../multi/types.ts";
import { multiView } from "../multi/view.ts";
import { wordSettings } from "../settings.ts";
import { WordRepo } from "../store/repo.ts";

export const GONE = "This button doesn't work any more. Use `/duo play` or `/quad play`.";

/** The clicker's Duo or Quad round, as a button or the guess modal sees it. */
export interface MultiRound {
  repo: WordRepo;
  puzzle: MultiPuzzle;
  game: MultiGame | null;
  now: number;
  timeZone: string;
}

/**
 * The round of `[mode, date]` from a custom ID, or what to tell the clicker: only today's board
 * plays, as only today's classic word does. Reads only; the caller's move is one transaction.
 */
export function loadRound(
  i: { guildId: string | null; user: { id: string } },
  db: Database,
  args: string[],
): MultiRound | string {
  const mode = modeOf(args[0]);

  if (!i.guildId || !mode) return GONE;

  const now = Date.now();
  const { timeZone } = wordSettings(db, i.guildId);
  const repo = new WordRepo(db);
  const date = args[1] ?? "";
  const puzzle =
    date === dateIn(now, timeZone) ? repo.multiPuzzles.get(i.guildId, mode, date) : null;

  if (!puzzle) return `That ${MODES[mode].name} is over. Use \`/${mode} play\` for today's.`;

  const game = repo.multiGames.get({ ...puzzle, userId: i.user.id });

  return { repo, puzzle, game, now, timeZone };
}

type Click = MessageComponentInteraction | ModalSubmitInteraction;

/** A click, or a submit from the board's own message, can edit that message. */
const canUpdate = (i: Click): i is MessageComponentInteraction =>
  !("fields" in i) || i.isFromMessage();

/** Redraws the board in place; a modal opened elsewhere gets it as a private reply. */
export async function showRound(i: Click, r: MultiRound, game: MultiGame | null): Promise<void> {
  const view = multiView({ ...r, game });

  try {
    if (canUpdate(i)) await i.update(view);
    else await i.reply({ ...view, flags: MessageFlags.Ephemeral });
  } catch (err) {
    log.error("word", "could not show the board", err);
  }
}
