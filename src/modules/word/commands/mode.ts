import type { SlashCommand } from "../../../core/types.ts";
import type { Mode } from "../multi/types.ts";
import { TRACKS } from "../tracks.ts";
import { dispatch } from "./dispatch.ts";
import { leaderboardFor } from "./leaderboard.ts";
import { modeData } from "./mode-data.ts";
import { multiLetters } from "./multi-letters.ts";
import { multiPlay } from "./multi.ts";
import { statsFor } from "./stats.ts";

/** `/duo` or `/quad`. */
export const modeCommand = (mode: Mode, random: () => number): SlashCommand =>
  dispatch(
    modeData(mode),
    {
      play: multiPlay(mode),
      letters: multiLetters(mode),
      stats: statsFor(TRACKS[mode]),
      leaderboard: leaderboardFor(TRACKS[mode]),
    },
    random,
  );
