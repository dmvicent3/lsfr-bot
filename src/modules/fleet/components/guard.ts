import { type MessageComponentInteraction, MessageFlags } from "discord.js";
import type { FleetRepo } from "../store/repo.ts";
import type { Game } from "../types.ts";

/** An ephemeral answer to a click; pings no one. */
export async function tell(i: MessageComponentInteraction, content: string): Promise<void> {
  await i.reply({ content, flags: MessageFlags.Ephemeral, allowedMentions: { parse: [] } });
}

/**
 * The live game behind this board when the clicker is its player; otherwise answers them. Runs
 * before the lock, so outsiders and old boards get their own answer even while jevos aims.
 */
export async function liveGameFor(
  i: MessageComponentInteraction,
  repo: FleetRepo,
): Promise<Game | null> {
  const game = repo.games.byMessage(i.message.id);

  if (game?.playerId === i.user.id) return game;

  if (!game) {
    await i.update({ components: [] });
    await i.followUp({ content: "This game is over.", flags: MessageFlags.Ephemeral });

    return null;
  }

  await tell(i, `This is <@${game.playerId}>'s game. Start your own with \`/fleet play\`.`);

  return null;
}
