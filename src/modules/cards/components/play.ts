import type { ComponentHandler } from "../../../core/types.ts";
import { runnerIn } from "../session/registry.ts";
import { NO_GAME, playReply } from "./replies.ts";

/**
 * `cards:play:<roundId>:<cardId>` (card ids hold a colon), clicked in the private hand, which then
 * updates in place. Deferred first: the game's queue may be busy posting.
 */
export const playHandler: ComponentHandler = {
  id: "cards:play",
  async handle(i, args) {
    await i.deferUpdate();
    const runner = runnerIn(i.channelId);

    if (!runner) {
      await i.editReply({ content: NO_GAME, components: [] });

      return;
    }

    const [roundId = "", ...card] = args;
    const out = await runner.onPlay({ roundId, userId: i.user.id, cardId: card.join(":") });
    const note = playReply(out.result);
    const content = note ? `${note}\n\n${out.hand.content}` : out.hand.content;

    await i.editReply({ content, components: out.hand.components, allowedMentions: { parse: [] } });
  },
};
