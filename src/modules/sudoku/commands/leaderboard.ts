import { leaderboardHandler } from "../../../core/leaderboard-command.ts";
import { leaderboardView } from "./leaderboard-view.ts";

/** Public, so the server sees it; mentions never ping. */
export const leaderboard = leaderboardHandler(leaderboardView);
