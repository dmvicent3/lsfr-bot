import type { ComponentHandler } from "../../../core/types.ts";
import { leaderboardView, toPeriod } from "../commands/leaderboard.ts";
import { WordRepo } from "../store/repo.ts";
import type { Period } from "../types.ts";

/** `word:page:<period>:<page>`; anything unreadable is today's first page. */
export function pageArgs(args: string[]): { period: Period; page: number } {
  const page = Number(args[1]);

  return { period: toPeriod(args[0]), page: Number.isInteger(page) ? page : 1 };
}

/** Re-renders in place as of now, so a page from last week shows this week. */
export const pageHandler: ComponentHandler = {
  id: "word:page",
  async handle(i, args, ctx) {
    if (!i.guildId) return;

    const view = { ...pageArgs(args), guildId: i.guildId, viewerId: i.user.id, now: Date.now() };
    await i.update(leaderboardView(ctx.db, new WordRepo(ctx.db), view));
  },
};
