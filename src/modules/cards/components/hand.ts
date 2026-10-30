import { MessageFlags } from "discord.js";
import type { ComponentHandler } from "../../../core/types.ts";
import { runnerIn } from "../session/registry.ts";
import { NO_GAME } from "./replies.ts";

/** `cards:hand`: the player's cards, privately, as buttons. */
export const handHandler: ComponentHandler = {
  id: "cards:hand",
  async handle(i) {
    const runner = runnerIn(i.channelId);
    const view = runner ? await runner.onHand(i.user.id) : { content: NO_GAME, components: [] };

    await i.reply({ ...view, flags: MessageFlags.Ephemeral, allowedMentions: { parse: [] } });
  },
};
