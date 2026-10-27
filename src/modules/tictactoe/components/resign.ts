import type { ComponentHandler } from "../../../core/types.ts";
import { renderGame } from "../render.ts";
import { GameStore } from "../store/games.ts";
import { startThinking, stopThinking } from "../thinking.ts";
import { liveGameFor, tell } from "./guard.ts";

export const resignHandler: ComponentHandler = {
  id: "tictactoe:resign",
  async handle(i, _args, ctx) {
    const store = new GameStore(ctx.db);
    const game = await liveGameFor(i, store);

    if (!game) return;

    if (!startThinking(game.guildId)) return tell(i, "jevos is still thinking.");

    try {
      store.remove(game.guildId);
      const outcome = { kind: "resigned" } as const;
      await i.update(renderGame({ game, outcome, thinking: false, last: null }));
    } finally {
      stopThinking(game.guildId);
    }
  },
};
