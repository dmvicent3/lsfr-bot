import { pageHandler as handler } from "../../../core/page-handler.ts";
import { leaderboardView } from "../commands/leaderboard-view.ts";
import { GameStore } from "../store/games.ts";

/** Re-renders in place as of now, so a page from last week shows this week. */
export const pageHandler = handler("minesweeper:page", (db) => new GameStore(db), leaderboardView);
