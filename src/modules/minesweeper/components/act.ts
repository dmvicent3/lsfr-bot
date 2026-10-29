import type { MessageComponentInteraction } from "discord.js";
import { renderBoard } from "../render/board.ts";
import type { GameStore } from "../store/games.ts";
import type { Game, Step } from "../types.ts";
import { gameOver, refusal, tell } from "./guard.ts";

/**
 * Plays one click on this board: read, move and save run with no await in between, so two quick
 * clicks never interleave; a save that lands after the game finished counts as an old board.
 */
export async function act(
  i: MessageComponentInteraction,
  store: GameStore,
  move: (game: Game) => Step,
): Promise<void> {
  const game = store.byMessage(i.message.id);
  const refuse = refusal(i, game);

  if (refuse || !game) return refuse?.();

  const step = move(game);

  if (step.hint) return tell(i, step.hint);

  if (!store.save(step.game)) return gameOver(i);

  await i.update(renderBoard(step.game, { playerName: i.user.displayName, now: Date.now() }));
}
