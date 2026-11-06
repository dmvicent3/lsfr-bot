import { leaderboardHandler } from "../../../core/leaderboard-command.ts";
import { leaderboardView } from "./leaderboard-view.ts";
import type { CommandCtx } from "./types.ts";

const handle = leaderboardHandler(leaderboardView);

/** Public, so the server sees it; mentions never ping. */
export const leaderboard = ({ i, guildId, ctx, store }: CommandCtx): Promise<void> =>
  handle({ i, guildId, db: ctx.db, repo: store });
