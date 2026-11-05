import type { Database } from "bun:sqlite";
import { leaderboardHandler } from "../../../core/leaderboard-command.ts";
import type { PageAsk } from "../../../core/leaderboard-view.ts";
import { pageButtons } from "../../../core/page-buttons.ts";
import { dateIn } from "../../../core/zoned.ts";
import { periodStandings } from "../play/standings.ts";
import { renderLeaderboard } from "../render/leaderboard.ts";
import { wordSettings } from "../settings.ts";
import type { WordRepo } from "../store/repo.ts";
import { trackOf } from "../tracks.ts";
import type { Track } from "../types.ts";
import type { CommandCtx } from "./types.ts";

/** A track's leaderboard page as of `now`; the slash command and the page buttons both send this. */
export const leaderboardView = (track: Track) => (db: Database, repo: WordRepo, v: PageAsk) => {
  const today = dateIn(v.now, wordSettings(db, v.guildId).timeZone);
  const { range, list } = periodStandings(repo, track, { ...v, today });
  const page = renderLeaderboard({ ...v, track, range, list });

  return {
    content: page.content,
    components: pageButtons(track.pagePrefix, v.period, page.page, page.pages),
    allowedMentions: { parse: [] as [] },
  };
};

/** Public, so the server sees it; mentions never ping. The `mode` option picks the game. */
export const leaderboard = (c: CommandCtx): Promise<void> =>
  leaderboardHandler(leaderboardView(trackOf(c.i.options.getString("mode"))))(c);
