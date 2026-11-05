import { MessageFlags } from "discord.js";
import { reply } from "../../../core/replies.ts";
import type { Mode } from "../multi/types.ts";
import { multiView } from "../multi/view.ts";
import { modePuzzle, NO_WORDS } from "./multi-puzzle.ts";
import type { Handler } from "./types.ts";

/** `/duo play` and `/quad play`: today's private board for the mode, to play or look back on. */
export const multiPlay =
  (mode: Mode): Handler =>
  async (c) => {
    const today = modePuzzle(c, mode);

    if (!today) return reply(c.i, NO_WORDS);

    const game = c.repo.multiGames.get({ ...today.puzzle, userId: c.i.user.id });

    await c.i.reply({ ...multiView({ ...today, game }), flags: MessageFlags.Ephemeral });
  };
