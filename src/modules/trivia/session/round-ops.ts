import { kaosMessage } from "../render/kaos.ts";
import { buttonMessage, typedMessage } from "../render/question.ts";
import { buttonAwards, buttonTick } from "../rounds/button.ts";
import { kaosAwards, kaosTick } from "../rounds/kaos.ts";
import { typedTick } from "../rounds/typed.ts";
import type { Award, Round } from "../rounds/types.ts";
import type { AskedKind } from "../store/types.ts";
import type { Outgoing, SessionState } from "./types.ts";

/** Applies the clock to whichever kind of round is open. */
export function advance(r: Round, now: number): Round {
  if (r.kind === "typed") return typedTick(r, now);

  if (r.kind === "button") return buttonTick(r, now);

  return kaosTick(r, now);
}

export function roundMessage(r: Round, s: SessionState): Outgoing {
  if (r.kind === "typed") return typedMessage(r, s.topicBy);

  if (r.kind === "button") return buttonMessage(r, s.topicBy);

  return kaosMessage(r, s.names);
}

export function awardsOf(r: Round): Award[] {
  if (r.kind === "typed") return r.award ? [r.award] : [];

  return r.kind === "button" ? buttonAwards(r) : kaosAwards(r);
}

/** Everyone who took part: the winner, every picker, every claimer. */
export function playersOf(r: Round): string[] {
  if (r.kind === "typed") return r.award ? [r.award.userId] : [];

  const ids = r.kind === "button" ? r.picks.map((p) => p.userId) : r.claims.map((c) => c?.userId);

  return [...new Set(ids.filter((id): id is string => id !== undefined))];
}

export function itemOf(r: Round): { kind: AskedKind; id: number } {
  return r.kind === "kaos"
    ? { kind: "kaos", id: r.list.id }
    : { kind: "question", id: r.question.id };
}

/** Whether the clock changed something the message shows. */
export function visiblyChanged(before: Round, after: Round): boolean {
  if (before.closedAt !== after.closedAt) return true;

  if (before.kind === "typed" && after.kind === "typed") return before.level !== after.level;

  return before.kind === "kaos" && after.kind === "kaos" && before.hinted !== after.hinted;
}
