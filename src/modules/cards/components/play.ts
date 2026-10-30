import type { ComponentHandler } from "../../../core/types.ts";
import { runnerIn } from "../session/registry.ts";
import { NO_GAME, playReply } from "./replies.ts";

/** `cards:play:<roundId>:<index>`, clicked in the private hand, which then updates in place. */
export const playHandler: ComponentHandler = {
  id: "cards:play",
  async handle(i, args) {
    const runner = runnerIn(i.channelId);

    if (!runner) {
      await i.update({ content: NO_GAME, components: [] });

      return;
    }

    const [roundId = "", index = ""] = args;
    const out = await runner.onPlay({ roundId, userId: i.user.id, index: Number(index) });
    const note = playReply(out.result);
    const content = note ? `${note}\n\n${out.hand.content}` : out.hand.content;

    await i.update({ content, components: out.hand.components, allowedMentions: { parse: [] } });
  },
};
