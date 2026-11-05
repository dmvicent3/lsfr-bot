import { pageHandler } from "../../../core/page-handler.ts";
import type { ComponentHandler } from "../../../core/types.ts";
import { leaderboardView } from "../commands/leaderboard.ts";
import { WordRepo } from "../store/repo.ts";
import { TRACKS } from "../tracks.ts";

export { pageArgs } from "../../../core/page-args.ts";

/** Each game's ◀ ▶ (`word:page`, `word:duopage`, `word:quadpage`), re-rendered as of now. */
export const pageHandlers: ComponentHandler[] = [TRACKS.classic, TRACKS.duo, TRACKS.quad].map((t) =>
  pageHandler(t.pagePrefix, (db) => new WordRepo(db), leaderboardView(t)),
);
