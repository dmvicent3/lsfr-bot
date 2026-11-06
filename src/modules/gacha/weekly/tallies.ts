import { log } from "../../../core/log.ts";
import { readPoll, voteCounts } from "../../../core/polls/post.ts";
import type { Rest } from "../../../core/polls/types.ts";
import type { PollTally, WeekPolls } from "../banner/types.ts";
import type { PollKind, StoredPoll } from "../types.ts";

/** One poll's votes, or null when it was never posted or Discord won't show it. */
async function tally(rest: Rest, poll: StoredPoll | undefined): Promise<PollTally | null> {
  if (!poll?.channelId || !poll.messageId) return null;

  try {
    const state = await readPoll(rest, poll.channelId, poll.messageId);

    return state ? { options: poll.options, votes: voteCounts(state) } : null;
  } catch (err) {
    log.error("gacha:polls", `reading the ${poll.kind} poll failed`, err);

    return null;
  }
}

/** The votes of a week's polls; a missing or unreadable poll is null (settled at random). */
export async function readTallies(
  rest: Rest,
  polls: Partial<Record<PollKind, StoredPoll>>,
): Promise<WeekPolls> {
  return { five: await tally(rest, polls.five), fours: await tally(rest, polls.fours) };
}
