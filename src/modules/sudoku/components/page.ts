import { pageRequest } from "../../../core/page-args.ts";
import type { ComponentHandler } from "../../../core/types.ts";
import { leaderboardView } from "../commands/leaderboard-view.ts";
import { SudokuRepo } from "../store/repo.ts";

export { pageArgs } from "../../../core/page-args.ts";

/** Re-renders in place as of now, so a page from last week shows this week. */
export const pageHandler: ComponentHandler = {
  id: "sudoku:page",
  async handle(i, args, ctx) {
    const view = pageRequest(i, args);

    if (view) await i.update(leaderboardView(ctx.db, new SudokuRepo(ctx.db), view));
  },
};
