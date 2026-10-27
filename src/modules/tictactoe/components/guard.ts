import { type MessageComponentInteraction, MessageFlags } from "discord.js";
import type { GameStore } from "../store/games.ts";
import type { Game } from "../types.ts";

/** An ephemeral answer to a click; pings no one. */
export async function tell(i: MessageComponentInteraction, content: string): Promise<void> {
  await i.reply({ content, flags: MessageFlags.Ephemeral, allowedMentions: { parse: [] } });
}

/** The live game behind this board when the clicker is its player; otherwise answers them. */
export async function liveGameFor(
  i: MessageComponentInteraction,
  store: GameStore,
): Promise<Game | null> {
  const game = i.guildId ? store.get(i.guildId) : null;

  if (!game || game.messageId !== i.message.id) {
    await i.update({ components: [] });
    await i.followUp({ content: "This game is over.", flags: MessageFlags.Ephemeral });

    return null;
  }

  if (game.playerId === i.user.id) return game;

  await tell(i, `This is <@${game.playerId}>'s game. Start your own with /tictactoe once it ends.`);

  return null;
}
