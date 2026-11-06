import type { PickOutcome, PodiumPick, Weekend } from "./types.ts";
import { choosePick, isComplete, isPredictable } from "./predictions.ts";
import type { MotorsportRepo } from "../repo.ts";
import { rulesOf } from "./rules.ts";
import type { Session, SessionRef, Viewer } from "../types.ts";
import { loadWeekend } from "./weekend.ts";

const GONE = "That session isn't open for predictions.";

/** Why a scheduled session's picks can no longer change. */
function closed(weekend: Weekend, session: Session): string {
  const { eventName } = weekend.event;

  return rulesOf(session.series).fantasy
    ? `🔒 Predictions for the ${eventName} weekend locked at its first session.`
    : `🔒 Predictions for the ${eventName} ${session.title} closed at the start.`;
}

/**
 * Puts the driver at the podium position in the viewer's prediction while the session is open
 * to them. `completed` says whether the prediction now counts and didn't before.
 */
export function savePick(
  repo: MotorsportRepo,
  viewer: Viewer,
  ref: SessionRef,
  { index, driverId }: PodiumPick,
): PickOutcome {
  const { series, eventId, sessionId } = ref;
  const weekend = loadWeekend(repo, viewer, series, eventId);
  const session = weekend?.event.sessions.find((s) => s.sessionId === sessionId);

  if (!weekend || !session || !isPredictable(series, sessionId) || ![0, 1, 2].includes(index)) {
    return { ok: false, text: GONE };
  }

  if (!weekend.open.includes(session)) return { ok: false, text: closed(weekend, session) };

  const before = repo.predictions.get(viewer.userId, series, eventId, sessionId);
  const picks = choosePick(before, index, driverId);
  repo.predictions.set(viewer, ref, picks);

  return { ok: true, picks, completed: isComplete(picks) !== isComplete(before) };
}
