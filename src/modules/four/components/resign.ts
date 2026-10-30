import type { ComponentHandler } from "../../../core/types.ts";
import { renderGame } from "../render/board.ts";
import { FourRepo } from "../store/repo.ts";
import { startThinking, stopThinking, thinkKey } from "../thinking.ts";
import { liveGameFor, tell } from "./guard.ts";

export const resignHandler: ComponentHandler = {
  id: "four:resign",
  async handle(i, _args, ctx) {
    const repo = new FourRepo(ctx.db);
    const game = await liveGameFor(i, repo);

    if (!game) return;

    const key = thinkKey(game.guildId, game.playerId);

    if (!startThinking(key)) return tell(i, "jevos is still thinking.");

    try {
      const finish = { result: "loss", how: "resigned", endedAt: Date.now() } as const;

      if (!repo.games.finish(game, finish)) return await tell(i, "This game is over.");

      const outcome = { kind: "resigned" } as const;
      await i.update(renderGame({ game, outcome, thinking: false, last: null }));
    } finally {
      stopThinking(key);
    }
  },
};
