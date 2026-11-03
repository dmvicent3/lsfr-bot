import type { ComponentHandler } from "../../../core/types.ts";
import { ownEntry } from "../own.ts";
import { FeedbackRepo } from "../store/repo.ts";

/** `feedback:remove:<id>`: the author takes the post down; the row stays, marked removed. */
export const removeHandler: ComponentHandler = {
  id: "feedback:remove",
  async handle(i, args, ctx) {
    const repo = new FeedbackRepo(ctx.db);
    const entry = await ownEntry(i, args[0], repo);

    if (!entry) return;

    repo.entries.remove(entry.id, Date.now());

    try {
      await i.message.delete();
    } catch {
      await i.update({ content: "🗑️ Feedback removed.", components: [] });
    }
  },
};
