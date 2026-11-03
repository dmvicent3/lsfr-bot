import { tell } from "../../../core/replies.ts";
import type { ModalHandler } from "../../../core/types.ts";
import { postBody } from "../message.ts";
import { ownEntry } from "../own.ts";
import { FeedbackRepo } from "../store/repo.ts";

/** `feedback:save:<id>`: the author's new text, shown in place on the public post. */
export const saveHandler: ModalHandler = {
  id: "feedback:save",
  async handle(i, args, ctx) {
    const repo = new FeedbackRepo(ctx.db);
    const entry = await ownEntry(i, args[0], repo);

    if (!entry) return;

    repo.entries.edit(entry.id, i.fields.getTextInputValue("text").trim(), Date.now());
    const saved = repo.entries.get(entry.id);

    if (saved && i.isFromMessage()) {
      await i.update(postBody(saved));

      return;
    }

    await tell(i, "Feedback saved.");
  },
};
