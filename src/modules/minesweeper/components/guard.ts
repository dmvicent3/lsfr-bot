import { type MessageComponentInteraction, MessageFlags } from "discord.js";
import type { Game } from "../types.ts";

/** An ephemeral answer to a click; pings no one. */
export async function tell(i: MessageComponentInteraction, content: string): Promise<void> {
  await i.reply({ content, flags: MessageFlags.Ephemeral, allowedMentions: { parse: [] } });
}

/** An old board (finished, replaced or unknown) loses its controls. */
export async function gameOver(i: MessageComponentInteraction): Promise<void> {
  await i.update({ components: [] });
  await i.followUp({ content: "This game is over.", flags: MessageFlags.Ephemeral });
}

/** Answers a click that may not play this board; null when it may. */
export function refusal(
  i: MessageComponentInteraction,
  game: Game | null,
): (() => Promise<void>) | null {
  if (!game || game.finishedAt !== null) return () => gameOver(i);

  if (game.playerId !== i.user.id) {
    return () =>
      tell(i, `This is <@${game.playerId}>'s game. Start your own with /minesweeper play.`);
  }

  return null;
}
