import type { EventSchedule, Session } from "../../../../src/modules/motorsport/types.ts";

/** An F1 session of the "e" weekend in Austin. */
export const f1Session = (sessionId: string, title: string, start: string): Session => ({
  series: "f1",
  eventId: "e",
  eventName: "Austin",
  sessionId,
  title,
  start: new Date(start),
  end: new Date(Date.parse(start) + 3_600_000),
  pingable: true,
});

export const FP1 = f1Session("practice-1", "Practice 1", "2026-10-17T16:30:00Z");
export const SQ = f1Session("sprint-qualification", "Sprint Qualifying", "2026-10-17T20:30:00Z");
export const SPRINT = f1Session("sprint-race", "Sprint", "2026-10-18T17:00:00Z");
export const QUALI = f1Session("qualifying", "Qualifying", "2026-10-18T21:00:00Z");
export const RACE = f1Session("race", "Race", "2026-10-19T19:00:00Z");

/** A sprint weekend: it locks at Sprint Qualifying. */
export const SPRINT_WEEKEND: EventSchedule = {
  eventId: "e",
  eventName: "Austin",
  sessions: [FP1, SQ, SPRINT, QUALI, RACE],
};

/** A normal weekend: it locks at Qualifying. */
export const NORMAL_WEEKEND: EventSchedule = {
  eventId: "e",
  eventName: "Austin",
  sessions: [FP1, QUALI, RACE],
};
