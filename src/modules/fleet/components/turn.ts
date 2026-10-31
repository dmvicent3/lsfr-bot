import type { MessageComponentInteraction } from "discord.js";
import { log } from "../../../core/log.ts";
import type { PlayDeps } from "../commands/types.ts";
import { jevosTurn } from "../jevos.ts";
import { renderGame } from "../render/board.ts";
import { settle } from "../settle.ts";
import type { FleetRepo } from "../store/repo.ts";
import type { Moved } from "../types.ts";

export interface Turn {
  i: MessageComponentInteraction;
  repo: FleetRepo;
  d: PlayDeps;
}

/**
 * jevos answers on the board: "aiming" first, then its shot. Stored first: after a restart or a
 * failed update the game waits on jevos, and the next click picks that up.
 */
export async function answer({ i, repo, d }: Turn, mine: Moved): Promise<void> {
  repo.games.put(mine.game);
  await i.update(renderGame({ ...mine, aiming: true }));
  const moved = await jevosTurn(d.jev, mine.game, d.random, Date.now());
  settle(repo, moved, Date.now());

  try {
    await i.editReply(renderGame({ ...moved, aiming: false }));
  } catch (err) {
    log.error("fleet", "could not show jevos's shot; the next click shows it", err);
  }
}
