import type { ComponentHandler } from "../../../core/types.ts";
import { renderGame } from "../render.ts";
import { GameStore } from "../store/games.ts";
import { startThinking, stopThinking } from "../thinking.ts";
import { liveGameFor, tell } from "./guard.ts";

export const resignHandler: ComponentHandler = {
  id: "tictactoe:resign",
  async handle(i, _args, ctx) {
    const guildId = i.guildId ?? "";

    if (!startThinking(guildId)) return tell(i, "jevos is still thinking.");

    try {
      const store = new GameStore(ctx.db);
      const game = await liveGameFor(i, store);

      if (!game) return;

      store.remove(guildId);
      const outcome = { kind: "resigned" } as const;
      await i.update(renderGame({ game, outcome, thinking: false, last: null }));
    } finally {
      stopThinking(guildId);
    }
  },
};
