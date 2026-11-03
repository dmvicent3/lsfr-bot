import { ComponentType, type MessageComponentInteraction, MessageFlags } from "discord.js";
import { tell } from "../../../core/replies.ts";
import type { FleetRepo } from "../store/repo.ts";
import type { Game } from "../types.ts";

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
    // Only the controls go: a V2 board keeps its card (an older embed board has nothing else).
    const card = i.message.components.filter((c) => c.type !== ComponentType.ActionRow);
    await i.update({ components: card });
    await i.followUp({ content: "This game is over.", flags: MessageFlags.Ephemeral });

    return null;
  }

  await tell(i, `This is <@${game.playerId}>'s game. Start your own with \`/fleet play\`.`);

  return null;
}
