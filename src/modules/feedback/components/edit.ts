import type { ComponentHandler } from "../../../core/types.ts";
import { feedbackModal } from "../modal.ts";
import { ownEntry } from "../own.ts";
import { FeedbackRepo } from "../store/repo.ts";

/** `feedback:edit:<id>`: the author gets the form back, prefilled. */
export const editHandler: ComponentHandler = {
  id: "feedback:edit",
  async handle(i, args, ctx) {
    const entry = await ownEntry(i, args[0], new FeedbackRepo(ctx.db));

    if (!entry) return;

    await i.showModal(feedbackModal(`feedback:save:${entry.id}`, "Edit feedback", entry.text));
  },
};
