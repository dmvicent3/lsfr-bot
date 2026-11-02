import { type MessageComponentInteraction, MessageFlags } from "discord.js";
import { tell } from "../../../core/replies.ts";
import { clickVerdict } from "../click.ts";
import { lockedCopy } from "../render/board.ts";
import type { FourRepo } from "../store/repo.ts";
import type { Game } from "../types.ts";

/**
 * The live game behind this board when the clicker is its player; otherwise answers them. Runs
 * before the thinking lock, so outsiders and old boards get their own answer even mid-move.
 */
export async function liveGameFor(
  i: MessageComponentInteraction,
  repo: FourRepo,
): Promise<Game | null> {
  const game = repo.games.byMessage(i.message.id);
  const verdict = clickVerdict(game, { userId: i.user.id });

  if (verdict === "play") return game;

  if (verdict === "over") {
    await i.update({ components: lockedCopy(i.message.components.map((c) => c.toJSON())) });
    await i.followUp({ content: "This game is over.", flags: MessageFlags.Ephemeral });

    return null;
  }

  await tell(i, `This is <@${game?.playerId}>'s game. Start your own with \`/four play\`.`);

  return null;
}
