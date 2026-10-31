import { MessageFlags, type MessageComponentInteraction } from "discord.js";
import type { HandView } from "../render/hand.ts";
import { runnerIn } from "../session/registry.ts";
import type { Runner } from "../session/runner.ts";
import type { TurnClick } from "../session/types.ts";
import { NO_GAME } from "./replies.ts";

/** A private reply from the channel's game, or "no game" when there is none. Deferred first: the queue may be busy. */
export async function privately(
  i: MessageComponentInteraction,
  fn: (runner: Runner) => Promise<string>,
): Promise<void> {
  await i.deferReply({ flags: MessageFlags.Ephemeral });
  const runner = runnerIn(i.channelId);
  const content = runner ? await fn(runner) : NO_GAME;
  await i.editReply({ content, allowedMentions: { parse: [] } });
}

/** A click in the private hand view, which then updates in place with a note on top. */
export async function inHand(
  i: MessageComponentInteraction,
  fn: (runner: Runner) => Promise<{ note: string; hand: HandView }>,
): Promise<void> {
  await i.deferUpdate();
  const runner = runnerIn(i.channelId);

  if (!runner) {
    await i.editReply({ content: NO_GAME, components: [] });

    return;
  }

  const { note, hand } = await fn(runner);
  const content = note ? `${note}\n\n${hand.content}` : hand.content;
  await i.editReply({ content, components: hand.components, allowedMentions: { parse: [] } });
}

/** Who clicked, on which turn (from the custom ID), now. */
export const turnClick = (i: MessageComponentInteraction, turn: string | undefined): TurnClick => ({
  userId: i.user.id,
  turnNo: Number(turn),
  now: Date.now(),
});
