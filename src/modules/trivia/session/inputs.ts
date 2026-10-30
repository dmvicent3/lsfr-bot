import { claimLine } from "../render/results.ts";
import { topicSelect } from "../render/topic.ts";
import { buttonPick } from "../rounds/button.ts";
import { kaosAnswer } from "../rounds/kaos.ts";
import { typedAnswer } from "../rounds/typed.ts";
import type { Answer, Pick } from "../rounds/types.ts";
import { KAOS_POINTS } from "../scoring.ts";
import { closeRound } from "./close.ts";
import { nameOf } from "./closers.ts";
import { edit, send } from "./send.ts";
import type { Deps, SessionState } from "./types.ts";

export type Named<T> = T & { name: string };

export interface PickOutcome {
  result: "locked" | "already" | "closed";
  index: number | null;
}

/** A channel message: a typed answer, or a KAOS claim posted at once. */
export async function answer(s: SessionState, d: Deps, m: Named<Answer>): Promise<void> {
  const r = s.round;

  if (!r) return;

  s.names.set(m.userId, m.name);
  s.active.add(m.userId);

  if (r.kind === "button") return;

  if (r.kind === "typed") {
    s.round = typedAnswer(r, m);

    if (s.round.closedAt !== null) await closeRound(s, d, m.at);

    return;
  }

  const { round, claimed } = kaosAnswer(r, m);

  if (claimed === null) return;

  s.round = round;
  s.dirty = true;
  await send(s, d, {
    content: claimLine(m.name, r.list.items[claimed]?.answer ?? "", KAOS_POINTS),
  });

  if (round.closedAt !== null) await closeRound(s, d, m.at);
}

/** A button click, with the option the player holds; anything but the open button round is over. */
export async function pick(
  s: SessionState,
  d: Deps,
  roundId: string,
  p: Named<Pick>,
): Promise<PickOutcome> {
  const r = s.round;

  if (r?.kind !== "button" || r.id !== roundId) return { result: "closed", index: null };

  const { round, result } = buttonPick(r, p);

  if (result !== "locked") {
    const held = r.picks.find((x) => x.userId === p.userId)?.index ?? null;

    return { result, index: result === "already" ? held : null };
  }

  s.names.set(p.userId, p.name);
  s.active.add(p.userId);
  s.round = round;

  if (round.closedAt !== null) await closeRound(s, d, p.at);

  return { result: "locked", index: p.index };
}

/** The sole survivor's choice; the next tick opens a round in that topic. */
export async function chooseTopic(
  s: SessionState,
  d: Deps,
  c: { userId: string; topic: string; at: number },
): Promise<"ok" | "not-yours" | "over"> {
  const perk = s.perk;

  if (!perk || !perk.topics.includes(c.topic)) return "over";

  if (perk.userId !== c.userId) return "not-yours";

  s.perk = null;
  s.topic = { name: c.topic, by: nameOf(s, c.userId) };
  d.repo.topicPicks.add({ guildId: s.guildId, userId: c.userId, category: c.topic, at: c.at });
  const chosen = { state: "chosen" as const, topic: c.topic };
  await edit(d, perk.messageId, { components: topicSelect(s.sessionId, perk.topics, chosen) });

  return "ok";
}
