import { topicSelect } from "../render/topic.ts";
import { closeRound } from "./close.ts";
import { openRound } from "./open.ts";
import { advance, roundMessage, visiblyChanged } from "./round-ops.ts";
import { edit } from "./send.ts";
import type { Deps, SessionState } from "./types.ts";

/** A topic menu left unanswered: shown as lapsed, and the session moves on. */
async function lapsePerk(s: SessionState, d: Deps): Promise<void> {
  const perk = s.perk;

  if (!perk) return;

  s.perk = null;
  await edit(d, perk.messageId, {
    components: topicSelect(s.sessionId, perk.topics, { state: "timeout" }),
  });
}

/** One second of a session: wait on the perk, open a round after the gap, or advance the open one. */
export async function step(s: SessionState, d: Deps, now: number): Promise<void> {
  if (s.perk) {
    if (now >= s.perk.until) await lapsePerk(s, d);

    return;
  }

  if (!s.round) {
    if (now >= s.nextAt) await openRound(s, d, now);

    return;
  }

  const before = s.round;
  const after = advance(before, now);
  s.round = after;

  if (after.closedAt !== null) return closeRound(s, d, now);

  if (visiblyChanged(before, after) || s.dirty) {
    s.dirty = false;
    await edit(d, s.messageId, roundMessage(after, s));
  }
}
