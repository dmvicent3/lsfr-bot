import { pageRequest } from "../../../core/page-args.ts";
import type { ComponentHandler } from "../../../core/types.ts";
import { leaderboardView } from "../commands/leaderboard.ts";
import { WordRepo } from "../store/repo.ts";

export { pageArgs } from "../../../core/page-args.ts";

/** Re-renders in place as of now, so a page from last week shows this week. */
export const pageHandler: ComponentHandler = {
  id: "word:page",
  async handle(i, args, ctx) {
    const view = pageRequest(i, args);

    if (view) await i.update(leaderboardView(ctx.db, new WordRepo(ctx.db), view));
  },
};
