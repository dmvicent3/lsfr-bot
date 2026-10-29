import { reply } from "../../../core/replies.ts";
import { renderStats } from "../render/stats.ts";
import { rollup } from "../stats.ts";
import type { CommandCtx } from "./types.ts";

export async function stats({ i, guildId, store }: CommandCtx): Promise<void> {
  const member = i.options.getUser("member") ?? i.user;
  const rows = store.finished(guildId, member.id);

  await reply(i, renderStats(rollup(rows), member.displayName));
}
