import { reply } from "../../../core/replies.ts";
import { dateIn } from "../../../core/zoned.ts";
import { dailyStats } from "../daily/stats.ts";
import { dailyStatsLine } from "../render/result.ts";
import { renderStats } from "../render/stats.ts";
import { minesweeperTimeZone } from "../settings.ts";
import { rollup } from "../stats.ts";
import type { CommandCtx } from "./types.ts";

export async function stats({ i, guildId, ctx, store }: CommandCtx): Promise<void> {
  const member = i.options.getUser("member") ?? i.user;
  const today = dateIn(Date.now(), minesweeperTimeZone(ctx.db, guildId));
  const daily = dailyStatsLine(dailyStats(store.dailies.finished(guildId, member.id), today));
  const practice = renderStats(rollup(store.finished(guildId, member.id)), member.displayName);

  await reply(i, `${practice}\n${daily}`);
}
