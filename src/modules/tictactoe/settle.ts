import type { Client } from "discord.js";
import { log } from "../../core/log.ts";
import { renderGame } from "./render.ts";
import type { GameStore } from "./store/games.ts";
import type { Game, Moved } from "./types.ts";

/** Keeps a game that goes on; a finished one leaves the table, freeing the server. */
export function settle(store: GameStore, { game, outcome }: Moved): void {
  if (outcome.kind === "playing") store.put(game);
  else store.remove(game.guildId);
}

export const gameLink = (g: Game): string =>
  `https://discord.com/channels/${g.guildId}/${g.channelId}/${g.messageId ?? ""}`;

/** Ends an idle game: its message says so (best effort) and the server is free again. */
export async function abandon(client: Client, store: GameStore, game: Game): Promise<void> {
  store.remove(game.guildId);

  try {
    const channel = await client.channels.fetch(game.channelId);

    if (!channel?.isTextBased() || !game.messageId) return;

    const outcome = { kind: "abandoned" } as const;
    await channel.messages.edit(
      game.messageId,
      renderGame({ game, outcome, thinking: false, last: null }),
    );
  } catch (err) {
    log.error("tictactoe", `could not mark ${gameLink(game)} abandoned`, err);
  }
}
