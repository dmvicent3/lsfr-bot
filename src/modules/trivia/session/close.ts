import { nextIdle } from "../idle.ts";
import type { Round } from "../rounds/types.ts";
import { closeButton, closeKaos, closeTyped } from "./closers.ts";
import { awardsOf, itemOf, playersOf, roundMessage } from "./round-ops.ts";
import { edit } from "./send.ts";
import type { Deps, SessionState } from "./types.ts";

/** Gap between a round's close and the next question. */
export const GAP_MS = 5_000;

function storeAwards(s: SessionState, d: Deps, r: Round, now: number): void {
  const itemId = itemOf(r).id;
  const awards = awardsOf(r);
  const base = { guildId: s.guildId, sessionId: s.sessionId, kind: r.kind, itemId, at: now };
  d.repo.scores.add(awards.map((a) => ({ ...base, userId: a.userId, points: a.points, ms: a.ms })));

  for (const a of awards) s.points.set(a.userId, (s.points.get(a.userId) ?? 0) + a.points);
}

async function announce(s: SessionState, d: Deps, r: Round, now: number): Promise<void> {
  if (r.kind === "typed") return closeTyped(s, d, r, now);

  if (r.kind === "button") return closeButton(s, d, r, now);

  return closeKaos(s, d, r);
}

/** Shows the closed round, stores its points, announces them and schedules the next round. */
export async function closeRound(s: SessionState, d: Deps, now: number): Promise<void> {
  const r = s.round;

  if (!r) return;

  await edit(d, s.messageId, roundMessage(r, s));
  storeAwards(s, d, r, now);
  await announce(s, d, r, now);
  const players = playersOf(r);
  s.idle = nextIdle(s.idle, players.length > 0);
  s.rounds++;
  s.lastPlayers = players;
  s.round = null;
  s.messageId = null;
  s.nextAt = now + GAP_MS;
}
