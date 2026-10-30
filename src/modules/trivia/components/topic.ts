import { MessageFlags } from "discord.js";
import type { ComponentHandler } from "../../../core/types.ts";
import { runnerIn } from "../session/registry.ts";
import { topicReply } from "./replies.ts";

/** `trivia:topic:<sessionId>`: the sole survivor's choice; the runner updates the menu. */
export const topicHandler: ComponentHandler = {
  id: "trivia:topic",
  async handle(i, args) {
    await i.deferUpdate();
    const runner = runnerIn(i.channelId);
    const topic = i.isStringSelectMenu() ? (i.values[0] ?? "") : "";
    const live = runner && String(runner.state.sessionId) === args[0];
    const result = live ? await runner.onTopic(i.user.id, topic) : "over";

    if (result !== "ok") {
      await i.followUp({ content: topicReply(result), flags: MessageFlags.Ephemeral });
    }
  },
};
