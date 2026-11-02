import { leaderboardView, toPeriod } from "./leaderboard-view.ts";
import type { CommandCtx } from "./types.ts";

/** Public, so the server sees it; mentions never ping. */
export async function leaderboard({ i, guildId, db, repo }: CommandCtx): Promise<void> {
  const period = toPeriod(i.options.getString("period"));
  const page = i.options.getInteger("page") ?? 1;

  await i.reply(
    leaderboardView(db, repo, { guildId, period, page, viewerId: i.user.id, now: Date.now() }),
  );
}
