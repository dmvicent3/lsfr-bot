import { pageHandler as handler } from "../../../core/page-handler.ts";
import { leaderboardView } from "../commands/leaderboard-view.ts";
import { SudokuRepo as Repo } from "../store/repo.ts";

export { pageArgs } from "../../../core/page-args.ts";
/** Re-renders in place as of now, so a page from last week shows this week. */
export const pageHandler = handler("sudoku:page", (db) => new Repo(db), leaderboardView);
