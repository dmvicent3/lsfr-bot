import { describe, expect, test } from "bun:test";
import {
  isResultRows,
  RESULTS_WINDOW_MS,
  renderResults,
  resultKind,
  resultsDue,
  type SessionResult,
} from "./results.ts";
import { seriesInfo } from "./series.ts";
import type { SeriesKey, Session } from "./types.ts";

const END = Date.parse("2026-10-11T14:00:00Z");

function session(series: SeriesKey, sessionId: string): Session {
  return {
    series,
    eventId: "2026-singapore-grand-prix",
    eventName: "Singapore Grand Prix",
    sessionId,
    title: sessionId,
    start: new Date(END - 2 * 3_600_000),
    end: new Date(END),
    pingable: true,
  };
}

describe("resultKind", () => {
  test("F1 and MotoGP result sessions", () => {
    expect(resultKind("f1", "qualifying")).toBe("qualifying");
    expect(resultKind("f1", "sprint-qualification")).toBe("sprint-qualifying");
    expect(resultKind("f1", "sprint-race")).toBe("sprint");
    expect(resultKind("f1", "race")).toBe("race");
    expect(resultKind("motogp", "qualifying2")).toBe("qualifying");
    expect(resultKind("motogp", "sprint")).toBe("sprint");
    expect(resultKind("motogp", "race")).toBe("race");
  });

  test("everything else has no results", () => {
    expect(resultKind("f1", "practice-1")).toBeNull();
    expect(resultKind("motogp", "qualifying1")).toBeNull();
    expect(resultKind("wec", "race")).toBeNull();
  });
});

describe("resultsDue", () => {
  const race = session("f1", "race");
  const fp1 = session("f1", "practice-1");

  test("a result session that has ended is due until the window closes", () => {
    expect(resultsDue([race, fp1], new Set(), END - 1)).toEqual([]);
    expect(resultsDue([race, fp1], new Set(), END)).toEqual([race]);
    expect(resultsDue([race], new Set(), END + RESULTS_WINDOW_MS - 1)).toEqual([race]);
    expect(resultsDue([race], new Set(), END + RESULTS_WINDOW_MS)).toEqual([]);
  });

  test("already posted results are not due", () => {
    expect(resultsDue([race], new Set(["2026-singapore-grand-prix/race"]), END)).toEqual([]);
  });
});

describe("renderResults", () => {
  const result: SessionResult = {
    rows: [
      { pos: "1", id: "1", name: "Verstappen", team: "Red Bull", time: "1:42:00.785" },
      { pos: "2", id: "2", name: "Hamilton", team: "Ferrari", time: "+3.123" },
      { pos: "10", id: "10", name: "Antonelli", team: "Aston Martin", time: "+1 lap" },
    ],
  };

  test("visible heading, aligned table hidden behind one spoiler", () => {
    const text = renderResults(seriesInfo("f1"), "Singapore Grand Prix", "race", result);
    expect(text).toBe(
      [
        "## 🏁 F1 — Singapore Grand Prix · Race results",
        "||`P1  Verstappen Red Bull     1:42:00.785`",
        "`P2  Hamilton   Ferrari           +3.123`",
        "`P10 Antonelli  Aston Martin      +1 lap`||",
      ].join("\n"),
    );
  });

  test("sprint qualifying label", () => {
    const text = renderResults(seriesInfo("f1"), "Singapore Grand Prix", "sprint-qualifying", {
      rows: [{ pos: "1", id: "1", name: "Verstappen", team: "Red Bull", time: "1:31.156" }],
    });
    expect(text).toBe(
      "## 🏁 F1 — Singapore Grand Prix · Sprint Qualifying results\n||`P1 Verstappen Red Bull 1:31.156`||",
    );
  });

  test("long names are cut so the table stays narrow", () => {
    const text = renderResults(seriesInfo("motogp"), "X", "race", {
      rows: [
        { pos: "1", id: "1", name: "Di Giannantonio Longname", team: "Ducati", time: "40:46.582" },
      ],
    });
    expect(text).toContain("`P1 Di Giannantonio Ducati 40:46.582`");
  });

  test("without the spoiler", () => {
    const text = renderResults(seriesInfo("f1"), "Singapore Grand Prix", "race", result, {
      spoiler: false,
    });
    expect(text).not.toContain("||");
    expect(text.split("\n")[1]).toBe("`P1  Verstappen Red Bull     1:42:00.785`");
  });

  test("a full grid fits in one message", () => {
    const rows = Array.from({ length: 30 }, (_, i) => ({
      pos: String(i + 1),
      id: String(i),
      name: "Giovinazzi Long",
      team: "Aston Martin",
      time: "+1:23.456",
    }));
    const text = renderResults(seriesInfo("f1"), "Singapore Grand Prix", "race", { rows });
    expect(text.length).toBeLessThanOrEqual(2000);
    expect(text).toContain("P30");
  });

  test("no rows says so", () => {
    expect(renderResults(seriesInfo("f1"), "X", "race", { rows: [] })).toContain(
      "No classification",
    );
  });
});

test("stored rows need a driver id to be scored against", () => {
  const row = { pos: "1", name: "Norris", team: "McLaren", time: "1:30.000" };
  expect(isResultRows([{ ...row, id: "4" }])).toBe(true);
  expect(isResultRows([row])).toBe(false);
});
