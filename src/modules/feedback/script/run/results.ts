import { readPoll } from "../../../../core/polls/post.ts";
import { resultsText } from "../format.ts";
import { voters } from "../rest-reads.ts";
import type { Args, Outcome, ScriptDeps, Tally } from "../types.ts";

/** The poll as Discord has it now: votes and voters per answer, and whether it is final. */
export async function results(args: Args["results"], d: ScriptDeps): Promise<Outcome> {
  const stored = d.repo.polls.get(args.id);

  if (!stored) return { ok: false, text: `No poll #${args.id}.` };

  const state = await readPoll(d.rest, stored.channelId, stored.messageId);

  if (!state) return { ok: false, text: `The message of poll #${args.id} has no poll.` };

  const tallies: Tally[] = [];

  for (const answer of state.answers) {
    const names = await voters(d.rest, stored, answer.id);
    tallies.push({ text: answer.text, count: answer.count ?? names.length, voters: names });
  }

  return { ok: true, text: resultsText(stored, state, tallies) };
}
