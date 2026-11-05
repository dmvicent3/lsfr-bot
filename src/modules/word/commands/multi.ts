import { MessageFlags } from "discord.js";
import { reply } from "../../../core/replies.ts";
import { MODES } from "../multi/modes.ts";
import { todayMulti } from "../multi/today.ts";
import type { Mode } from "../multi/types.ts";
import { multiView } from "../multi/view.ts";
import { wordSettings } from "../settings.ts";
import type { Handler } from "./types.ts";

/** `/word duo` and `/word quad`: today's private board for the mode, to play or look back on. */
export const multiPlay =
  (mode: Mode): Handler =>
  async ({ i, guildId, db, repo, random }) => {
    const settings = wordSettings(db, guildId);
    const now = Date.now();
    const puzzle = todayMulti(repo, { guildId, settings, now, random }, mode);

    if (puzzle.words.length < MODES[mode].boards) return reply(i, "No words for today's puzzle.");

    const game = repo.multiGames.get({ ...puzzle, userId: i.user.id });
    const view = multiView({ puzzle, game, now, timeZone: settings.timeZone });

    await i.reply({ ...view, flags: MessageFlags.Ephemeral });
  };
