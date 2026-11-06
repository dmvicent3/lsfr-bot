import { reply } from "../../../core/replies.ts";
import { clampPage } from "../text/format.ts";
import { HISTORY_PAGE, historyText } from "../text/history.ts";
import type { CommandCtx } from "./types.ts";

/** Private: the caller's pulls, newest first, a page at a time. */
export async function history({ i, who, repo, roster }: CommandCtx): Promise<void> {
  const total = repo.pulls.count(who);
  const page = clampPage(i.options.getInteger("page") ?? 1, total, HISTORY_PAGE);
  const rows = repo.pulls.recent(who, { limit: HISTORY_PAGE, offset: (page - 1) * HISTORY_PAGE });

  await reply(i, historyText({ rows, roster, page, total }));
}
