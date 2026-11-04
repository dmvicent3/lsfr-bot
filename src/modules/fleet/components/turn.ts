import type { MessageComponentInteraction } from "discord.js";
import { log } from "../../../core/log.ts";
import type { PlayDeps } from "../commands/types.ts";
import { jevosTurn } from "../jevos.ts";
import { boardMessage } from "../board-message.ts";
import { showFleet } from "../fleet-message.ts";
import { settle } from "../settle.ts";
import type { FleetRepo } from "../store/repo.ts";
import type { Moved } from "../types.ts";

export interface Turn {
  i: MessageComponentInteraction;
  repo: FleetRepo;
  d: PlayDeps;
}

/** Shows the player's fleet under the board; a newly posted one's id is kept while play goes on. */
export async function followBoard(t: Turn, moved: Moved, changed: boolean): Promise<void> {
  const shown = await showFleet(t.i.channel, moved.game, changed);

  if (shown !== moved.game && moved.outcome.kind === "playing") t.repo.games.put(shown);
}

/**
 * jevos answers on the board: "aiming" first, then its shot. Stored first: after a restart or a
 * failed update the game waits on jevos, and the next click picks that up.
 */
export async function answer(t: Turn, mine: Moved): Promise<void> {
  const { i, repo, d } = t;
  repo.games.put(mine.game);
  await i.update(boardMessage({ ...mine, aiming: true }));
  const shot = await jevosTurn(d.jev, mine.game, d.random, Date.now());
  // A cursor move queued while jevos aimed is in the stored game; it goes on the board with the shot.
  const queued = repo.games.get(mine.game.guildId, mine.game.playerId)?.cursor ?? shot.game.cursor;
  const moved = { ...shot, game: { ...shot.game, cursor: queued } };
  settle(repo, moved, Date.now());

  const board = boardMessage({ ...moved, aiming: false });

  try {
    await i.editReply(board);
  } catch {
    // The token runs out after 15 min (a long jev queue); the message itself needs none.
    await i.message.edit(board).catch((err: unknown) => {
      log.error("fleet", "could not show jevos's shot; the next click shows it", err);
    });
  }

  await followBoard(t, moved, true);
}
