import type { Featured, Pools } from "../engine/types.ts";
import { eligible, sample } from "./eligible.ts";
import type { PollTally, WeekPolls } from "./types.ts";

export const POLL_SIZE = { five: 4, fours: 8 } as const;
export const FEATURED_FOURS = 3;

/** The `n` most voted options; ties (and a poll nobody voted in) are settled at random. */
export function topVoted(tally: PollTally, n: number, random: () => number): string[] {
  const shuffled = sample(
    tally.options.map((id, k) => ({ id, votes: tally.votes[k] ?? 0 })),
    tally.options.length,
    random,
  );

  return shuffled
    .toSorted((a, b) => b.votes - a.votes)
    .slice(0, n)
    .map((o) => o.id);
}

/** The winners of a poll topped up with random eligible drivers, so there are always `n`. */
function winners(
  tally: PollTally | null,
  v: { pool: readonly string[]; n: number },
  random: () => number,
): string[] {
  const won = tally ? topVoted(tally, v.n, random) : [];
  const rest = v.pool.filter((id) => !won.includes(id));

  return [...won, ...sample(rest, v.n - won.length, random)];
}

/** The next banner: the polls' winners, or random eligible drivers where a poll is missing. */
export function settleBanner(
  v: { polls: WeekPolls; pools: Pools; recent: readonly Featured[] },
  random: () => number,
): Featured {
  const fives = eligible(v.pools[5], v.recent, 1);
  const fours = eligible(v.pools[4], v.recent, FEATURED_FOURS);
  const [five] = winners(v.polls.five, { pool: fives, n: 1 }, random);

  if (five === undefined) throw new Error("settleBanner: no ★5 drivers");

  return { five, fours: winners(v.polls.fours, { pool: fours, n: FEATURED_FOURS }, random) };
}

/** The options for next week's polls: random eligible drivers. */
export function pollOptions(
  v: { pools: Pools; recent: readonly Featured[] },
  random: () => number,
): { five: string[]; fours: string[] } {
  return {
    five: sample(eligible(v.pools[5], v.recent, POLL_SIZE.five), POLL_SIZE.five, random),
    fours: sample(eligible(v.pools[4], v.recent, POLL_SIZE.fours), POLL_SIZE.fours, random),
  };
}
