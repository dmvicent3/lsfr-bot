import { pageRequest } from "../../../core/page-args.ts";
import type { ComponentHandler } from "../../../core/types.ts";
import { leaderboardView } from "../commands/leaderboard-view.ts";
import { GridRepo } from "../store/repo.ts";

/** Re-renders in place as of now, so a page from last week shows this week. */
export const pageHandler: ComponentHandler = {
  id: "grid:page",
  async handle(i, args, ctx) {
    const view = pageRequest(i, args);

    if (view) await i.update(leaderboardView(ctx.db, new GridRepo(ctx.db), view));
  },
};
