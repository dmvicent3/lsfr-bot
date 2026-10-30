import { reply } from "../../../core/replies.ts";
import type { CommandCtx } from "./types.ts";
import { reportedLabel } from "./views.ts";

/** Flags the last question or list asked in this channel. */
export async function report({ i, guildId, repo }: CommandCtx): Promise<void> {
  const last = repo.asked.lastInChannel(i.channelId);

  if (!last) return reply(i, "Nothing to report here yet.");

  const reason = i.options.getString("reason");
  repo.reports.add({ guildId, ...last, userId: i.user.id, reason, at: Date.now() });
  await reply(i, `Reported ${reportedLabel(last)}.`);
}
