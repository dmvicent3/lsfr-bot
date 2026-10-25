import { describe, expect, test } from "bun:test";
import {
  isPenalty,
  isPostSession,
  matchesEvent,
  renderRuling,
  rulingFile,
  RULINGS_WINDOW_MS,
  rulingsEvent,
  summaryPrompt,
} from "./rulings.ts";
import type { Ruling } from "./types.ts";
import type { Session } from "../types.ts";

const session = (sessionId: string, start: string, hours = 1): Session => ({
  series: "f1",
  eventId: "singapore-grand-prix",
  eventName: "Singapore Grand Prix",
  sessionId,
  title: sessionId,
  start: new Date(start),
  end: new Date(Date.parse(start) + hours * 3_600_000),
  pingable: true,
});

const singapore = [
  session("practice-1", "2026-10-09T08:30:00Z"),
  session("sprint-qualification", "2026-10-09T12:30:00Z"),
  session("sprint-race", "2026-10-10T09:00:00Z"),
  session("qualifying", "2026-10-10T13:00:00Z"),
  session("race", "2026-10-11T12:00:00Z", 2),
];
const next = singapore.map((s) => ({
  ...s,
  eventId: "austin",
  eventName: "United States Grand Prix",
  start: new Date(s.start.getTime() + 7 * 86_400_000),
  end: new Date(s.end.getTime() + 7 * 86_400_000),
}));

describe("rulingsEvent", () => {
  const sessions = [...singapore, ...next];

  test("from the end of the first qualifying until a day after the race", () => {
    expect(rulingsEvent(sessions, Date.parse("2026-10-09T13:00:00Z"))).toBeNull();
    expect(rulingsEvent(sessions, Date.parse("2026-10-09T13:31:00Z"))?.eventId).toBe(
      "singapore-grand-prix",
    );
    const raceEnd = Date.parse("2026-10-11T14:00:00Z");
    expect(rulingsEvent(sessions, raceEnd + RULINGS_WINDOW_MS - 1)?.eventName).toBe(
      "Singapore Grand Prix",
    );
    expect(rulingsEvent(sessions, raceEnd + RULINGS_WINDOW_MS)).toBeNull();
  });

  test("a weekend without a race still closes a day after its last result session", () => {
    const noRace = singapore.filter((s) => s.sessionId !== "race");
    const lastEnd = Date.parse("2026-10-10T14:00:00Z");
    expect(rulingsEvent(noRace, lastEnd + RULINGS_WINDOW_MS - 1)).not.toBeNull();
    expect(rulingsEvent(noRace, lastEnd + RULINGS_WINDOW_MS)).toBeNull();
  });
});

test("event names match without accents, case or punctuation", () => {
  expect(matchesEvent("Sao Paulo Grand Prix", "São Paulo Grand Prix")).toBe(true);
  expect(matchesEvent("Singapore Grand Prix", "Singapore Grand Prix")).toBe(true);
  expect(matchesEvent("Singapore Grand Prix", "Japanese Grand Prix")).toBe(false);
  expect(matchesEvent(null, "Japanese Grand Prix")).toBe(false);
});

describe("isPostSession", () => {
  test("published after the session it is about ended", () => {
    // The Sprint ended 10:00Z; its rulings came out at 14:20Z.
    expect(isPostSession("Sprint", new Date("2026-10-10T14:20:00Z"), singapore)).toBe(true);
    expect(isPostSession("Sprint", new Date("2026-10-10T09:40:00Z"), singapore)).toBe(false);
    expect(isPostSession("Race", new Date("2026-10-11T14:02:00Z"), singapore)).toBe(true);
    expect(isPostSession("Qualifying", new Date("2026-10-11T10:25:00Z"), singapore)).toBe(true);
    expect(isPostSession("Sprint Qualifying", new Date("2026-10-09T14:00:00Z"), singapore)).toBe(
      true,
    );
  });

  test("practice and unknown sessions never", () => {
    expect(isPostSession("Practice 1", new Date("2026-10-12T00:00:00Z"), singapore)).toBe(false);
    expect(isPostSession("Free Practice 1", new Date("2026-10-12T00:00:00Z"), singapore)).toBe(
      false,
    );
  });
});

const ruling = (decision: string): Ruling => ({
  car: "14",
  driver: "Fernando Alonso",
  competitor: "Aston Martin Aramco F1 Team",
  session: "Qualifying",
  fact: "Changes made during parc fermé.",
  infringement: "Breach of Article B3.5.4.",
  decision,
  reason: "The team changed the setup under parc fermé.",
});

test("no penalty, no further action and reprimand-free outcomes aren't penalties", () => {
  expect(isPenalty("No further action.")).toBe(false);
  expect(isPenalty("No Penalty is applied")).toBe(false);
  expect(isPenalty("No action")).toBe(false);
  expect(isPenalty("Required to start the Race from the pit lane.")).toBe(true);
  expect(isPenalty("Reprimand (driving)")).toBe(true);
  expect(isPenalty("10 second time penalty and 2 penalty points")).toBe(true);
});

describe("renderRuling", () => {
  test("a penalty: who, session, what, decision, then the summary", () => {
    expect(
      renderRuling(
        ruling("Required to start the Race from the pit lane."),
        "Pit lane start for suspension changes.",
      ),
    ).toBe(
      [
        "⚖️ **Fernando Alonso** · Car 14 · Qualifying",
        "Changes made during parc fermé. → **Required to start the Race from the pit lane.**",
        "> Pit lane start for suspension changes.",
      ].join("\n"),
    );
  });

  test("without a summary (Gemini down) the rest still posts", () => {
    expect(renderRuling(ruling("Reprimand"), null)).not.toContain(">");
  });

  test("a non-penalty is one short line", () => {
    expect(renderRuling(ruling("No further action."), null)).toBe(
      "⚖️ Fernando Alonso · Car 14 · Qualifying: Changes made during parc fermé. → No further action.",
    );
  });

  test("a long fact is cut", () => {
    const text = renderRuling({ ...ruling("Reprimand"), fact: "x".repeat(1000) }, null);
    expect(text.length).toBeLessThan(500);
  });
});

test("the attachment: a safe file name and the document's text", () => {
  expect(rulingFile("Infringement - Car 23 - Causing a Collision with Car 5", "TEXT")).toEqual({
    name: "infringement-car-23-causing-a-collision-with-car-5.txt",
    data: "TEXT",
  });
});

test("the summary prompt carries the facts and asks for two sentences at most", () => {
  const prompt = summaryPrompt(ruling("Reprimand"));
  expect(prompt).toContain("Fernando Alonso");
  expect(prompt).toContain("Reprimand");
  expect(prompt).toContain("The team changed the setup under parc fermé.");
  expect(prompt).toContain("at most two short sentences");
});
