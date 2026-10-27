import type { MessageComponentInteraction } from "discord.js";
import { log } from "../../../core/log.ts";
import type { ComponentHandler } from "../../../core/types.ts";
import { playerMove } from "../game.ts";
import { jevosTurn } from "../jevos.ts";
import { renderGame } from "../render.ts";
import { settle } from "../settle.ts";
import { GameStore } from "../store/games.ts";
import { startThinking, stopThinking } from "../thinking.ts";
import type { Game, Moved, PlayDeps } from "../types.ts";
import { liveGameFor, tell } from "./guard.ts";

interface Turn {
  i: MessageComponentInteraction;
  store: GameStore;
  d: PlayDeps;
}

/** jevos answers on the board: "thinking" first, then its move. */
async function answer({ i, store, d }: Turn, mine: Moved): Promise<void> {
  // Stored first: after a restart mid-move, the row is on jevos's turn and /tictactoe sees it stale.
  store.put(mine.game);
  await i.update(renderGame({ ...mine, thinking: true, last: null }));
  const { moved, last } = await jevosTurn(d.jev, mine.game, d.random, Date.now());
  settle(store, moved);

  try {
    await i.editReply(renderGame({ ...moved, thinking: false, last }));
  } catch (err) {
    log.error("tictactoe", "could not show jevos's move; game dropped", err);
    store.remove(moved.game.guildId);
  }
}

async function play(t: Turn, game: Game, square: number): Promise<void> {
  const mine = playerMove(game, square, Date.now());

  if ("error" in mine) return void (await t.i.deferUpdate());

  if (mine.outcome.kind === "playing") return answer(t, mine);

  settle(t.store, mine);
  await t.i.update(renderGame({ ...mine, thinking: false, last: null }));
}

export function moveHandler(d: PlayDeps): ComponentHandler {
  return {
    id: "tictactoe:move",
    async handle(i, args, ctx) {
      const square = Number(args[0]) - 1;
      const store = new GameStore(ctx.db);
      const game = await liveGameFor(i, store);

      if (!game || square < 0 || square > 8) return;

      const guildId = game.guildId;

      if (!startThinking(guildId)) return tell(i, "jevos is still thinking.");

      try {
        await play({ i, store, d }, game, square);
      } finally {
        stopThinking(guildId);
      }
    },
  };
}
