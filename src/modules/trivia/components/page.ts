import type { ComponentHandler } from "../../../core/types.ts";
import { leaderboardView } from "../commands/leaderboard.ts";
import { toPeriod } from "../periods.ts";
import { TriviaRepo } from "../store/repo.ts";
import type { Period } from "../types.ts";

/** `trivia:page:<period>:<page>`; anything unreadable is today's first page. */
export function pageArgs(args: string[]): { period: Period; page: number } {
  const page = Number(args[1]);

  return { period: toPeriod(args[0]), page: Number.isInteger(page) ? page : 1 };
}

/** Re-renders in place as of now. */
export const pageHandler: ComponentHandler = {
  id: "trivia:page",
  async handle(i, args, ctx) {
    if (!i.guildId) return;

    const view = { ...pageArgs(args), guildId: i.guildId, viewerId: i.user.id, now: Date.now() };
    await i.update(leaderboardView(new TriviaRepo(ctx.db), view));
  },
};
