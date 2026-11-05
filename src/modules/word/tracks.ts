import { MODES } from "./multi/modes.ts";
import type { Mode } from "./multi/types.ts";
import { FIRST_MULTI_PUZZLE, FIRST_PUZZLE } from "./puzzle-date.ts";
import { MAX_ATTEMPTS } from "./scoring.ts";
import type { Track } from "./types.ts";

const multi = (mode: Mode): Track => ({
  name: MODES[mode].name,
  play: `/${mode} play`,
  firstPuzzle: FIRST_MULTI_PUZZLE,
  maxAttempts: MODES[mode].attempts,
  pagePrefix: `word:${mode}page`,
  finishedIn: (repo, guildId, range) => repo.multiGames.finishedIn(mode, guildId, range),
  finishedBy: (repo, guildId, userId) => repo.multiGames.finishedBy(mode, guildId, userId),
});

export const TRACKS = {
  classic: {
    name: "Word",
    play: "/word guess",
    firstPuzzle: FIRST_PUZZLE,
    maxAttempts: MAX_ATTEMPTS,
    pagePrefix: "word:page",
    finishedIn: (repo, guildId, range) => repo.games.finishedIn(guildId, range),
    finishedBy: (repo, guildId, userId) => repo.games.finishedBy(guildId, userId),
  },
  duo: multi("duo"),
  quad: multi("quad"),
} satisfies Record<"classic" | Mode, Track>;
