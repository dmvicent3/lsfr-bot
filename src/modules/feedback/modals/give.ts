import { tell } from "../../../core/replies.ts";
import type { ModalHandler } from "../../../core/types.ts";
import { postBody } from "../message.ts";
import { FeedbackRepo } from "../store/repo.ts";
import { OUTSIDE } from "../text.ts";

/** `feedback:give:<topic>`: stores the feedback and posts it publicly in the channel. */
export const giveHandler: ModalHandler = {
  id: "feedback:give",
  async handle(i, args, ctx) {
    if (!i.guildId) return tell(i, OUTSIDE);

    const repo = new FeedbackRepo(ctx.db);
    const id = repo.entries.add({
      guildId: i.guildId,
      userId: i.user.id,
      topic: args[0] ?? "other",
      text: i.fields.getTextInputValue("text").trim(),
      now: Date.now(),
    });
    const entry = repo.entries.get(id);

    if (!entry) return;

    const sent = await i.reply({ ...postBody(entry), withResponse: true });
    const message = sent.resource?.message;

    if (message) repo.entries.attach(id, message.channelId, message.id);
  },
};
