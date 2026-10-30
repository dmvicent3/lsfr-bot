import { sessionSummary } from "../render/summary.ts";
import { topicSelect } from "../render/topic.ts";
import type { Round } from "../rounds/types.ts";
import { nameOf } from "./closers.ts";
import { roundMessage } from "./round-ops.ts";
import { edit, send } from "./send.ts";
import type { Deps, EndReason, SessionState } from "./types.ts";

const IDLE_LINE = "No one's playing — trivia stopped.";

const closedAt = (r: Round, now: number): Round => ({ ...r, closedAt: r.closedAt ?? now });

/** Closes what is still open on screen, without points. */
async function closeScreen(s: SessionState, d: Deps, now: number): Promise<void> {
  if (s.round) await edit(d, s.messageId, roundMessage(closedAt(s.round, now), s));

  if (s.perk) {
    await edit(d, s.perk.messageId, {
      components: topicSelect(s.sessionId, s.perk.topics, { state: "timeout" }),
    });
  }
}

function top3(s: SessionState): { name: string; points: number }[] {
  return [...s.points]
    .toSorted((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([userId, points]) => ({ name: nameOf(s, userId), points }));
}

/** Ends the session once: the row, the screen, the summary (none when the channel is lost). */
export async function endSession(
  s: SessionState,
  d: Deps,
  reason: EndReason,
  now: number,
): Promise<void> {
  if (s.ended) return;

  s.ended = true;
  d.repo.sessions.end(s.sessionId, now);

  if (reason !== "lost") {
    await closeScreen(s, d, now);

    if (reason === "idle") await send(s, d, { content: IDLE_LINE });

    await send(s, d, { content: sessionSummary(s.rounds, top3(s)) });
  }

  s.round = null;
  s.perk = null;
  d.onEnd();
}
