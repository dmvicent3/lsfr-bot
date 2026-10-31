import { MessageFlags } from "discord.js";
import type { ComponentHandler } from "../../../core/types.ts";
import { runnerIn } from "../session/registry.ts";
import { NO_GAME } from "./replies.ts";

/** `shed:hand`: the player's cards, privately, with their moves. Deferred first: the queue may be busy. */
export const handHandler: ComponentHandler = {
  id: "shed:hand",
  async handle(i) {
    await i.deferReply({ flags: MessageFlags.Ephemeral });
    const runner = runnerIn(i.channelId);
    const view = runner ? await runner.onHand(i.user.id, 1) : { content: NO_GAME, components: [] };

    await i.editReply({ ...view, allowedMentions: { parse: [] } });
  },
};
