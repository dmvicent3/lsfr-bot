import { describe, expect, test } from "bun:test";
import {
  choosePick,
  isPredictable,
} from "../../../../src/modules/motorsport/predictions/predictions.ts";
import { openPredictions } from "../../../../src/modules/motorsport/predictions/lock.ts";
import { leaderboard } from "../../../../src/modules/motorsport/predictions/payout.ts";
import { renderPredictPicker } from "../../../../src/modules/motorsport/predictions/picker.ts";
import {
  renderLeaderboard,
  renderPredictionResults,
} from "../../../../src/modules/motorsport/predictions/render.ts";
import { scorePicks } from "../../../../src/modules/motorsport/predictions/scoring.ts";
import type { ResultRow } from "../../../../src/modules/motorsport/results/types.ts";
import { seriesInfo } from "../../../../src/modules/motorsport/series.ts";
import type { EventSchedule, Session } from "../../../../src/modules/motorsport/types.ts";

const row = (pos: string, id: string, name = id): ResultRow => ({
  pos,
  id,
  name,
  team: "",
  time: "",
});

/** VER, NOR, LEC finish 1-2-3; PIA is fourth. */
const rows = [
  row("1", "3", "Verstappen"),
  row("2", "4", "Norris"),
  row("3", "16", "Leclerc"),
  row("4", "81", "Piastri"),
];

describe("scorePicks", () => {
  test("perfect podium: 3 × 5 plus the 5 bonus", () => {
    expect(scorePicks(["3", "4", "16"], rows)).toEqual({ points: 20, perfect: true });
  });

  test("exact positions 5 each, podium driver in the wrong place 2", () => {
    expect(scorePicks(["3", "16", "4"], rows)).toEqual({ points: 9, perfect: false });
  });

  test("off the podium scores nothing", () => {
    expect(scorePicks(["81", "44", "1"], rows)).toEqual({ points: 0, perfect: false });
  });

  test("a podium position nobody classified in matches nobody", () => {
    expect(scorePicks(["3", "4", "16"], [row("1", "3"), row("–", "4")])).toEqual({
      points: 5,
      perfect: false,
    });
  });
});

describe("choosePick", () => {
  test("sets a position", () => {
    expect(choosePick([null, null, null], 1, "4")).toEqual([null, "4", null]);
  });

  test("picking a driver already placed elsewhere swaps the two", () => {
    expect(choosePick(["3", "4", "16"], 0, "16")).toEqual(["16", "4", "3"]);
    expect(choosePick(["3", null, null], 2, "3")).toEqual([null, null, "3"]);
  });
});

test("races and sprints of result series are predictable; F1 qualifying too", () => {
  expect(isPredictable("f1", "race")).toBe(true);
  expect(isPredictable("f1", "sprint-race")).toBe(true);
  expect(isPredictable("motogp", "sprint")).toBe(true);
  expect(isPredictable("f1", "qualifying")).toBe(true);
  expect(isPredictable("f1", "sprint-qualification")).toBe(true);
  expect(isPredictable("motogp", "qualifying2")).toBe(false);
  expect(isPredictable("f1", "practice-1")).toBe(false);
  expect(isPredictable("wec", "race")).toBe(false);
});

const session = (sessionId: string, title: string, start: string): Session => ({
  series: "motogp",
  eventId: "e",
  eventName: "Austin",
  sessionId,
  title,
  start: new Date(start),
  end: new Date(Date.parse(start) + 3_600_000),
  pingable: true,
});

const sprint = session("sprint", "Sprint", "2026-10-17T17:00:00Z");
const race = session("race", "Race", "2026-10-18T19:00:00Z");
const event: EventSchedule = {
  eventId: "e",
  eventName: "Austin",
  sessions: [session("qualifying2", "Qualifying 2", "2026-10-17T21:00:00Z"), sprint, race],
};

const at = (iso: string, lateSwap = false) => ({ now: Date.parse(iso), lateSwap });

test("open predictions: predictable sessions that haven't started", () => {
  expect(openPredictions(event, at("2026-10-17T12:00:00Z"))).toEqual([sprint, race]);
  expect(openPredictions(event, at("2026-10-17T17:00:00Z"))).toEqual([race]);
  expect(openPredictions(event, at("2026-10-17T17:00:00Z", true))).toEqual([race]);
  expect(openPredictions(event, at("2026-10-18T19:00:00Z"))).toEqual([]);
});

const entry = (userId: string, picks: [string, string, string], eventId = "e") => ({
  userId,
  eventId,
  sessionId: "race",
  kind: "race" as const,
  picks,
  rows,
});

describe("leaderboard", () => {
  test("season totals, best first; ties go to more perfect podiums", () => {
    const standings = leaderboard("motogp", [
      entry("a", ["3", "4", "16"]),
      entry("b", ["3", "16", "4"]),
      entry("b", ["3", "4", "81"], "f"),
      entry("c", ["81", "3", "4"]),
    ]);
    expect(standings).toEqual([
      { userId: "a", points: 20, perfect: 1, played: 1, pulls: 0 },
      { userId: "b", points: 19, perfect: 0, played: 2, pulls: 0 },
      { userId: "c", points: 4, perfect: 0, played: 1, pulls: 0 },
    ]);
  });

  test("rendered with mentions and ranks", () => {
    const text = renderLeaderboard(seriesInfo("motogp"), 2026, [
      { userId: "a", points: 20, perfect: 1, played: 1, pulls: 0 },
      { userId: "b", points: 19, perfect: 0, played: 2, pulls: 0 },
    ]);
    expect(text).toBe(
      [
        "## 🔮 MotoGP predictions — 2026 season",
        "**1.** <@a> · **20** pts · 1 perfect · 1 race",
        "**2.** <@b> · **19** pts · 2 races",
      ].join("\n"),
    );
  });

  test("F1 counts sessions and shows the pulls earned", () => {
    const text = renderLeaderboard(seriesInfo("f1"), 2026, [
      { userId: "a", points: 40, perfect: 1, played: 1, pulls: 40 },
      { userId: "b", points: 19, perfect: 0, played: 3, pulls: 7.25 },
    ]);
    expect(text).toBe(
      [
        "## 🔮 F1 predictions — 2026 season",
        "**1.** <@a> · **40** pts · 1 perfect · 1 session · 40 pulls",
        "**2.** <@b> · **19** pts · 3 sessions · 7.25 pulls",
      ].join("\n"),
    );
  });

  test("nobody yet", () => {
    expect(renderLeaderboard(seriesInfo("motogp"), 2026, [])).toBe(
      "## 🔮 MotoGP predictions — 2026 season\nNo predictions scored yet. Use 🔮 Predict on the pinned schedule.",
    );
  });
});

const score = (points: number, perfect: boolean) => ({ points, perfect, pulls: 0, chip: null });

test("prediction results: picks and points, best first, behind a spoiler", () => {
  const text = renderPredictionResults(
    [
      { userId: "b", picks: ["3", "16", "4"], score: score(9, false) },
      { userId: "a", picks: ["3", "4", "16"], score: score(20, true) },
    ],
    rows,
  );
  expect(text).toBe(
    [
      "### 🔮 Predictions",
      "||<@a> Verstappen · Norris · Leclerc → **20** pts 🎯",
      "<@b> Verstappen · Leclerc · Norris → **9** pts||",
    ].join("\n"),
  );
});

describe("renderPredictPicker", () => {
  const grid = rows.map(({ id, name }) => ({ id, name }));

  test("three selects with the user's picks preselected", () => {
    const picker = renderPredictPicker({
      info: seriesInfo("motogp"),
      eventName: "Austin",
      session: race,
      grid: grid,
      picks: ["4", null, null],
      others: [],
      lock: { phase: "session", at: race.start },
      chips: null,
    });
    expect(picker.content).toBe(
      "🔮 **MotoGP Austin Race** podium · locks <t:1792350000:R>\nPick all three to enter.",
    );
    expect(picker.components).toHaveLength(3);
    const [p1, p2] = picker.components.map((r) => r.components[0]);
    expect(p1).toMatchObject({
      custom_id: "motorsport:predict:motogp:e:race:0",
      placeholder: "P1",
    });
    expect(JSON.stringify(p1)).toContain('"value":"4","default":true');
    expect(JSON.stringify(p2)).not.toContain('"default":true');
  });

  test("complete picks say so; other open sessions get a switch button", () => {
    const picker = renderPredictPicker({
      info: seriesInfo("motogp"),
      eventName: "Austin",
      session: sprint,
      grid: grid,
      picks: ["3", "4", "16"],
      others: [race],
      lock: { phase: "session", at: sprint.start },
      chips: null,
    });
    expect(picker.content).toEndWith(
      "✅ Entered: Verstappen · Norris · Leclerc. Change any time before the start.",
    );
    expect(picker.components[3]?.components[0]).toMatchObject({
      custom_id: "motorsport:predictmenu:motogp:e:race",
      label: "Predict the Race",
    });
  });

  test("at most 25 drivers to choose from", () => {
    const many = Array.from({ length: 30 }, (_, i) => ({ id: String(i), name: `D${i}` }));
    const picker = renderPredictPicker({
      info: seriesInfo("motogp"),
      eventName: "X",
      session: race,
      grid: many,
      picks: [null, null, null],
      others: [],
      lock: { phase: "session", at: race.start },
      chips: null,
    });
    expect(JSON.stringify(picker.components[0]).match(/"value"/g)).toHaveLength(25);
  });
});
