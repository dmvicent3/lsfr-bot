import { reply } from "../../../core/replies.ts";
import { collectionText } from "../text/collection.ts";
import type { CommandCtx } from "./types.ts";

/** Private: someone's drivers (default the caller's) by tier, with completion. */
export async function collection({ i, who, repo, roster }: CommandCtx): Promise<void> {
  const user = i.options.getUser("user") ?? i.user;
  const copies = repo.owned.all({ guildId: who.guildId, userId: user.id });
  const page = i.options.getInteger("page") ?? 1;

  await reply(i, collectionText({ name: user.displayName, roster, copies, page }));
}
