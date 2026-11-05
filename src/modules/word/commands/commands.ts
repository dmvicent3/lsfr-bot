import type { SlashCommand } from "../../../core/types.ts";
import { TRACKS } from "../tracks.ts";
import { data } from "./data.ts";
import { dispatch } from "./dispatch.ts";
import { guess } from "./guess.ts";
import { leaderboardFor } from "./leaderboard.ts";
import { letters } from "./letters.ts";
import { play } from "./play.ts";
import { settings } from "./settings.ts";
import { statsFor } from "./stats.ts";

/** `/word`: the classic game. */
export const wordCommand = (random: () => number): SlashCommand =>
  dispatch(
    data,
    {
      play,
      guess,
      letters,
      stats: statsFor(TRACKS.classic),
      leaderboard: leaderboardFor(TRACKS.classic),
      settings,
    },
    random,
  );
