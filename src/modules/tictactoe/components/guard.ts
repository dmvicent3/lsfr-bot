import { type MessageComponentInteraction, MessageFlags } from "discord.js";
import { clickVerdict } from "../click.ts";
import { lockedCopy } from "../render.ts";
import type { GameStore } from "../store/games.ts";
import type { Game } from "../types.ts";

/** An ephemeral answer to a click; pings no one. */
export async function tell(i: MessageComponentInteraction, content: string): Promise<void> {
  await i.reply({ content, flags: MessageFlags.Ephemeral, allowedMentions: { parse: [] } });
}

/**
 * The live game behind this board when the clicker is its player; otherwise answers them. Runs
 * before the thinking lock, so outsiders and old boards get their own answer even mid-move.
 */
export async function liveGameFor(
  i: MessageComponentInteraction,
  store: GameStore,
): Promise<Game | null> {
  const game = i.guildId ? store.get(i.guildId) : null;
  const verdict = clickVerdict(game, { messageId: i.message.id, userId: i.user.id });

  if (verdict === "play") return game;

  if (verdict === "over") {
    await i.update({ components: lockedCopy(i.message.components.map((c) => c.toJSON())) });
    await i.followUp({ content: "This game is over.", flags: MessageFlags.Ephemeral });

    return null;
  }

  await tell(
    i,
    `This is <@${game?.playerId}>'s game. Start your own with /tictactoe once it ends.`,
  );

  return null;
}
