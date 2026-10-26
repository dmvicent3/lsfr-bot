import { reply } from "../../../core/replies.ts";
import type { CommandCtx } from "./types.ts";

/** The series row stays, so a later follow doesn't start over and repost. */
export async function unfollow({ i, repo }: CommandCtx): Promise<void> {
  const removed = repo.follows.remove(i.options.getString("title", true), i.user.id);
  await reply(i, removed ? "Unfollowed." : "You don't follow that one; pick one from the list.");
}
