import { pickRound } from "../pick.ts";
import { buttonStart } from "../rounds/button.ts";
import { kaosStart } from "../rounds/kaos.ts";
import { typedStart } from "../rounds/typed.ts";
import type { Round } from "../rounds/types.ts";
import type { RoundChoice } from "../types.ts";
import { itemOf, roundMessage } from "./round-ops.ts";
import { send } from "./send.ts";
import type { Deps, SessionState } from "./types.ts";

function build(choice: RoundChoice, s: SessionState, d: Deps, now: number): Round {
  const id = `${s.sessionId}-${s.rounds + 1}`;

  if (choice.kind === "kaos") return kaosStart(choice.list, id, now);

  if (choice.kind === "typed") return typedStart(choice.question, id, now, d.random);

  return buttonStart(choice.question, { id, now, random: d.random, expected: s.lastPlayers });
}

/** Picks, records and posts the next round, using up a chosen topic. */
export async function openRound(s: SessionState, d: Deps, now: number): Promise<void> {
  const choice = pickRound({
    questions: d.questions,
    lists: d.lists,
    lastAsked: d.repo.asked.lastAskedMap(s.guildId),
    topic: s.topic?.name ?? null,
    random: d.random,
  });
  const round = build(choice, s, d, now);
  const item = itemOf(round);
  d.repo.asked.add({
    guildId: s.guildId,
    channelId: s.channelId,
    kind: item.kind,
    itemId: item.id,
    at: now,
  });
  s.topicBy = s.topic?.by ?? null;
  s.topic = null;
  s.round = round;
  s.dirty = false;
  s.active = new Set();
  s.messageId = await send(s, d, roundMessage(round, s));
}
