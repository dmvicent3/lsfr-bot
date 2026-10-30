import type { Client } from "discord.js";
import { log } from "../../core/log.ts";
import { renderGame } from "./render/board.ts";
import { outcomeFinish } from "./store/finish.ts";
import type { FourRepo } from "./store/repo.ts";
import type { Game, Moved } from "./types.ts";

/** Keeps a game that goes on; a finished one leaves the table with its result. */
export function settle(repo: FourRepo, { game, outcome }: Moved, now: number): boolean {
  const finish = outcomeFinish(outcome, now);

  if (!finish) {
    repo.games.put(game);

    return true;
  }

  return repo.games.finish(game, finish);
}

export const gameLink = (g: Game): string =>
  `https://discord.com/channels/${g.guildId}/${g.channelId}/${g.messageId ?? ""}`;

/** An old board shown as abandoned, buttons gone (best effort). */
export async function markOld(client: Client, game: Game): Promise<void> {
  try {
    const channel = await client.channels.fetch(game.channelId);

    if (!channel?.isTextBased() || !game.messageId) return;

    const outcome = { kind: "abandoned" } as const;
    await channel.messages.edit(
      game.messageId,
      renderGame({ game, outcome, thinking: false, last: null }),
    );
  } catch (err) {
    log.error("four", `could not mark ${gameLink(game)} abandoned`, err);
  }
}
