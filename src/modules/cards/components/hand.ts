import { MessageFlags } from "discord.js";
import type { ComponentHandler } from "../../../core/types.ts";
import { runnerIn } from "../session/registry.ts";
import { NO_GAME } from "./replies.ts";

/** `cards:hand`: the player's cards, privately, as buttons. Deferred first: the queue may be busy. */
export const handHandler: ComponentHandler = {
  id: "cards:hand",
  async handle(i) {
    await i.deferReply({ flags: MessageFlags.Ephemeral });
    const runner = runnerIn(i.channelId);
    const view = runner ? await runner.onHand(i.user.id) : { content: NO_GAME, components: [] };

    await i.editReply({ ...view, allowedMentions: { parse: [] } });
  },
};
