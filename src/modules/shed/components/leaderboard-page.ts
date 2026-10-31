import type { ComponentHandler } from "../../../core/types.ts";
import { leaderboardView, toShedPeriod } from "../commands/leaderboard.ts";
import { ShedRepo } from "../store/repo.ts";

/** `shed:lb:<period>:<page>`: re-renders the leaderboard in place as of now. */
export const leaderboardPageHandler: ComponentHandler = {
  id: "shed:lb",
  async handle(i, [period, page], ctx) {
    if (!i.guildId) return;

    const view = {
      period: toShedPeriod(period),
      page: Number(page) || 1,
      guildId: i.guildId,
      viewerId: i.user.id,
      now: Date.now(),
    };
    await i.update(leaderboardView(new ShedRepo(ctx.db), view));
  },
};
