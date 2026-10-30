import type { MessageComponentInteraction } from "discord.js";
import { log } from "../../../core/log.ts";
import type { ComponentHandler } from "../../../core/types.ts";
import type { PlayDeps } from "../commands/types.ts";
import { isStale, playerDrop } from "../game.ts";
import { jevosTurn } from "../jevos.ts";
import { renderGame } from "../render/board.ts";
import { settle } from "../settle.ts";
import { FourRepo } from "../store/repo.ts";
import { startThinking, stopThinking, thinkKey } from "../thinking.ts";
import { COLS, type Game, type Moved } from "../types.ts";
import { liveGameFor, tell } from "./guard.ts";

interface Turn {
  i: MessageComponentInteraction;
  repo: FourRepo;
  d: PlayDeps;
}

/** jevos answers on the board: "thinking" first, then its drop. */
async function answer({ i, repo, d }: Turn, mine: Moved): Promise<void> {
  // Stored first: after a restart mid-move, the row is on jevos's turn and counts as stale.
  repo.games.put(mine.game);
  await i.update(renderGame({ ...mine, thinking: true, last: null }));
  const { moved, last } = await jevosTurn(d.jev, mine.game, d.random, Date.now());
  settle(repo, moved, Date.now());

  try {
    await i.editReply(renderGame({ ...moved, thinking: false, last }));
  } catch (err) {
    log.error("four", "could not show jevos's move; the next click shows it", err);
  }
}

async function play(t: Turn, game: Game, col: number): Promise<void> {
  const now = Date.now();

  if (isStale(game, now, false)) {
    t.repo.games.finish(game, { result: "loss", how: "abandoned", endedAt: now });
    const outcome = { kind: "abandoned" } as const;

    return void (await t.i.update(renderGame({ game, outcome, thinking: false, last: null })));
  }

  const mine = playerDrop(game, col, now);

  if ("error" in mine) return void (await t.i.deferUpdate());

  if (mine.outcome.kind === "playing") return answer(t, mine);

  settle(t.repo, mine, now);
  await t.i.update(renderGame({ ...mine, thinking: false, last: null }));
}

/** `four:drop:<col>`, col 1–7. */
export function dropHandler(d: PlayDeps): ComponentHandler {
  return {
    id: "four:drop",
    async handle(i, args, ctx) {
      const col = Number(args[0]) - 1;
      const repo = new FourRepo(ctx.db);
      const game = await liveGameFor(i, repo);

      if (!game || !Number.isInteger(col) || col < 0 || col >= COLS) return;

      const key = thinkKey(game.guildId, game.playerId);

      if (!startThinking(key)) return tell(i, "jevos is still thinking.");

      try {
        await play({ i, repo, d }, game, col);
      } finally {
        stopThinking(key);
      }
    },
  };
}
