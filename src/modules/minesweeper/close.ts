import type { Client } from "discord.js";
import { log } from "../../core/log.ts";
import { renderBoard } from "./render/board.ts";
import type { Game } from "./types.ts";

/** Edits an ended game's board to its final state with a note; best effort. */
export async function closeBoard(
  client: Client,
  game: Game,
  o: { playerName: string; note: string },
): Promise<void> {
  try {
    const channel = await client.channels.fetch(game.channelId);

    if (!channel?.isTextBased() || !game.messageId) return;

    await channel.messages.edit(game.messageId, renderBoard(game, { ...o, now: Date.now() }));
  } catch (err) {
    log.error("minesweeper", `could not close board ${game.messageId ?? "?"}`, err);
  }
}
