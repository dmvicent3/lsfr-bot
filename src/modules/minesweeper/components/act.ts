import type { MessageComponentInteraction } from "discord.js";
import { tell } from "../../../core/replies.ts";
import type { Ctx } from "../../../core/types.ts";
import { settle } from "../daily/finish.ts";
import { renderBoard } from "../render/board.ts";
import { GameStore } from "../store/games.ts";
import type { Game, Step } from "../types.ts";
import { announce } from "./announce.ts";
import { boardGame } from "./board-game.ts";
import { gameOver, refusal } from "./guard.ts";

/**
 * Plays one click on this board: read, move, score and save run with no await in between, so two
 * quick clicks never interleave; a save that lands after the game finished counts as an old board.
 */
export async function act(
  i: MessageComponentInteraction,
  ctx: Ctx,
  move: (game: Game) => Step,
): Promise<void> {
  const store = new GameStore(ctx.db);
  const game = boardGame(i, store, ctx.db);
  const refuse = refusal(i, game);

  if (refuse || !game) return refuse?.();

  const step = move(game);

  if (step.hint) return tell(i, step.hint);

  const { game: next, award } = settle(store, step.game);

  if (!store.save(next)) return gameOver(i);

  const now = Date.now();
  await i.update(renderBoard(next, { playerName: i.user.displayName, now, award }));

  if (next.kind === "daily" && next.result) await announce(i, next);
}
