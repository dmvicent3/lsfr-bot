import { pageRequest } from "../../../core/page-args.ts";
import type { ComponentHandler } from "../../../core/types.ts";
import { leaderboardView } from "../commands/leaderboard-view.ts";
import { DuelRepo } from "../store/repo.ts";

export { pageArgs } from "../../../core/page-args.ts";

/** Re-renders in place as of now, so a page from last week shows this week. */
export const pageHandler: ComponentHandler = {
  id: "duel:page",
  async handle(i, args, ctx) {
    const view = pageRequest(i, args);

    if (view) await i.update(leaderboardView(ctx.db, new DuelRepo(ctx.db), view));
  },
};
