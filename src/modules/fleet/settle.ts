import type { Client } from "discord.js";
import { log } from "../../core/log.ts";
import { boardMessage } from "./board-message.ts";
import { dropOldFleet } from "./old-fleet.ts";
import { outcomeFinish } from "./store/finish.ts";
import type { FleetRepo } from "./store/repo.ts";
import type { Game, Moved } from "./types.ts";

/** Keeps a game that goes on; a finished one leaves the table with its result. */
export function settle(repo: FleetRepo, { game, outcome }: Moved, now: number): boolean {
  const finish = outcomeFinish(outcome, now);

  if (!finish) {
    repo.games.put(game);

    return true;
  }

  return repo.games.finish(game, finish);
}

export const gameLink = (g: Game): string =>
  `https://discord.com/channels/${g.guildId}/${g.channelId}/${g.messageId ?? ""}`;

/** An old board shown as abandoned, controls gone (best effort). */
export async function markOld(client: Client, game: Game): Promise<void> {
  try {
    const channel = await client.channels.fetch(game.channelId);

    if (!channel?.isTextBased() || !game.messageId) return;

    const view = { game, outcome: { kind: "abandoned" }, aiming: false } as const;
    await channel.messages.edit(game.messageId, boardMessage(view));
    await dropOldFleet(channel, game);
  } catch (err) {
    log.error("fleet", `could not mark ${gameLink(game)} abandoned`, err);
  }
}
