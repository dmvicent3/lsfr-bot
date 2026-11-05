import type { MessageComponentInteraction, ModalSubmitInteraction } from "discord.js";
import { multiShareText } from "../multi/share-text.ts";
import type { MultiGame, MultiPuzzle } from "../multi/types.ts";
import { postShare } from "../post-share.ts";

/** The public result of a Duo or Quad that just finished: squares only, never the words. */
export const shareRound = (
  i: MessageComponentInteraction | ModalSubmitInteraction,
  puzzle: MultiPuzzle,
  game: MultiGame,
): Promise<void> => postShare(i, multiShareText(game, puzzle.words));
