import { Routes } from "discord.js";
import { asText, isRecord } from "../guards.ts";
import { pollBody, pollEnd } from "./body.ts";
import { pollState } from "./state.ts";
import type { PollRequest, PollState, PostedPoll, Rest } from "./types.ts";

/** Posts a native poll; null when Discord answered without a message id. Send errors throw. */
export async function postPoll(
  rest: Rest,
  channelId: string,
  p: PollRequest,
  now: number,
): Promise<PostedPoll | null> {
  const sent = await rest.post(Routes.channelMessages(channelId), { body: pollBody(p) });
  const messageId = isRecord(sent) ? asText(sent.id) : "";

  return messageId ? { messageId, endsAt: pollEnd(sent, now, p.hours) } : null;
}

/** The poll on a message as Discord has it now; null when the message has none. */
export async function readPoll(
  rest: Rest,
  channelId: string,
  messageId: string,
): Promise<PollState | null> {
  return pollState(await rest.get(Routes.channelMessage(channelId, messageId)));
}

/** Each answer's votes, in answer order (Discord numbers them from 1); a missing count is 0. */
export const voteCounts = (state: PollState): number[] =>
  state.answers.toSorted((a, b) => a.id - b.id).map((a) => a.count ?? 0);
