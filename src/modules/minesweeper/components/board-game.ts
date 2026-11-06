import type { Database } from "bun:sqlite";
import { type MessageComponentInteraction, MessageFlags } from "discord.js";
import { dateIn } from "../../../core/zoned.ts";
import { minesweeperTimeZone } from "../settings.ts";
import type { GameStore } from "../store/games.ts";
import type { Game } from "../types.ts";

/**
 * The game behind a clicked board. A daily is private and reopening it posts a new message, so a
 * click on an older private view plays the clicker's daily of today.
 */
export function boardGame(
  i: MessageComponentInteraction,
  store: GameStore,
  db: Database,
): Game | null {
  const byMessage = store.byMessage(i.message.id);

  if (byMessage || !i.guildId || !i.message.flags.has(MessageFlags.Ephemeral)) return byMessage;

  const today = dateIn(Date.now(), minesweeperTimeZone(db, i.guildId));

  return store.dailies.on(i.guildId, i.user.id, today);
}
