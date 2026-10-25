import { describe, expect, test } from "bun:test";
import {
  motogpCategoryId,
  motogpEventId,
  motogpSeasonId,
  motogpSessionId,
  parseMotogp,
} from "../../../../src/modules/motorsport/results/motogp-results.ts";
import {
  openf1SessionKey,
  parseOpenF1,
} from "../../../../src/modules/motorsport/results/openf1.ts";
import { formatDuration } from "../../../../src/modules/motorsport/results/openf1-times.ts";
import { fixture } from "../testing/fixtures.ts";

test("formatDuration", () => {
  expect(formatDuration(6120.785)).toBe("1:42:00.785");
  expect(formatDuration(91.156)).toBe("1:31.156");
  expect(formatDuration(59.5)).toBe("0:59.500");
});

describe("OpenF1", () => {
  test("finds the session by name and start time", async () => {
    const sessions = await fixture("openf1-sessions");
    expect(openf1SessionKey(sessions, "race", new Date("2026-10-11T12:00:00Z"))).toBe(11388);
    expect(openf1SessionKey(sessions, "qualifying", new Date("2026-10-10T13:00:00Z"))).toBe(11384);
    expect(openf1SessionKey(sessions, "sprint-qualifying", new Date("2026-10-09T12:30:00Z"))).toBe(
      11379,
    );
    expect(openf1SessionKey(sessions, "race", new Date("2026-10-18T20:00:00Z"))).toBeNull();
  });

  test("race: winner's time, gaps, top 10", async () => {
    const result = parseOpenF1(
      "race",
      await fixture("openf1-result-race"),
      await fixture("openf1-drivers"),
    );
    expect(result?.rows).toHaveLength(22);
    expect(result?.rows[21]).toMatchObject({ pos: "–", time: "DNF" });
    expect(result?.rows[0]).toEqual({
      pos: "1",
      id: "3",
      name: "Verstappen",
      team: "Red Bull",
      time: "1:42:00.785",
    });
    expect(result?.rows[9]).toEqual({
      pos: "10",
      id: "6",
      name: "Hadjar",
      team: "Red Bull",
      time: "+90.862",
    });
  });

  test("qualifying and sprint qualifying: best lap for P1, gap for the rest", async () => {
    const drivers = await fixture("openf1-drivers");
    const quali = parseOpenF1("qualifying", await fixture("openf1-result-quali"), drivers);
    expect(quali?.rows[0]).toEqual({
      pos: "1",
      id: "3",
      name: "Verstappen",
      team: "Red Bull",
      time: "1:31.373",
    });
    expect(quali?.rows[1]?.time).toMatch(/^\+\d+\.\d{3}$/);
    const sq = parseOpenF1("sprint-qualifying", await fixture("openf1-result-sq"), drivers);
    expect(sq?.rows[0]?.time).toBe("1:31.156");
    expect(sq?.rows[1]?.time).toBe("+0.120");
    expect(sq?.rows[8]).toMatchObject({ pos: "9", time: "SQ2 1:32.947" });
    expect(sq?.rows[9]).toMatchObject({ pos: "10", time: "SQ2 1:33.155" });
    expect(quali?.rows[10]).toMatchObject({ pos: "11", time: "Q2 1:32.784" });
    expect(quali?.rows).toHaveLength(22);
  });

  test("lapped and retired drivers", () => {
    const drivers = [
      { driver_number: 1, last_name: "Norris", team_name: "McLaren" },
      { driver_number: 2, last_name: "Ocon", team_name: "Haas F1 Team" },
      { driver_number: 3, last_name: "Bottas", team_name: "Cadillac" },
    ];
    const result = parseOpenF1(
      "race",
      [
        {
          position: 1,
          driver_number: 1,
          duration: 100,
          gap_to_leader: 0,
          dnf: false,
          dns: false,
          dsq: false,
        },
        {
          position: 2,
          driver_number: 2,
          duration: null,
          gap_to_leader: "+2 LAPS",
          dnf: false,
          dns: false,
          dsq: false,
        },
        {
          position: null,
          driver_number: 3,
          duration: null,
          gap_to_leader: null,
          dnf: true,
          dns: false,
          dsq: false,
        },
      ],
      drivers,
    );
    expect(result?.rows.map((r) => [r.pos, r.team, r.time])).toEqual([
      ["1", "McLaren", "1:40.000"],
      ["2", "Haas", "+2 laps"],
      ["–", "Cadillac", "DNF"],
    ]);
  });

  test("no results yet is null", () => {
    expect(parseOpenF1("race", [], [])).toBeNull();
    expect(parseOpenF1("race", { detail: "nope" }, [])).toBeNull();
  });
});

const row = (position: number | null, name: string, gap: { first: string; lap: string }) => ({
  position,
  rider: { full_name: name },
  constructor: { name: "KTM" },
  time: "40:00.000",
  gap,
});

describe("MotoGP", () => {
  test("walks season → event → category → session", async () => {
    expect(motogpSeasonId(await fixture("motogp-seasons"), 2026)).toBe(
      "e88b4e43-2209-47aa-8e83-0e0b1cedde6e",
    );
    const eventId = motogpEventId(await fixture("motogp-events"), "2026-10-11");
    expect(eventId).toBeString();
    expect(motogpEventId(await fixture("motogp-events"), "2026-10-12")).toBeNull();
    expect(motogpCategoryId(await fixture("motogp-categories"))).toBe(
      "e8c110ad-64aa-4e8e-8a86-f2f152f6a942",
    );
    const sessions = await fixture("motogp-sessions");
    expect(motogpSessionId(sessions, "race")).toBeString();
    expect(motogpSessionId(sessions, "qualifying")).not.toBe(motogpSessionId(sessions, "race"));
    expect(motogpSessionId(sessions, "sprint-qualifying")).toBeNull();
  });

  test("race classification", async () => {
    const result = parseMotogp("race", await fixture("motogp-RAC"));
    expect(result?.rows).toHaveLength(21);
    expect(result?.rows.at(-1)).toMatchObject({ time: "DNF" });
    expect(result?.rows[0]).toEqual({
      pos: "1",
      id: "ab06dbae-7d6e-47c3-b63f-b7ac6b7d3bcd",
      name: "Bezzecchi",
      team: "Aprilia",
      time: "40:46.582",
    });
    expect(result?.rows[1]).toEqual({
      pos: "2",
      id: "58448742-f520-466a-a1a1-bf3286cce9c3",
      name: "Fernandez",
      team: "Aprilia",
      time: "+4.260",
    });
  });

  test("qualifying: best lap, gaps, shared surnames get an initial", async () => {
    const result = parseMotogp(
      "qualifying",
      await fixture("motogp-Q2"),
      await fixture("motogp-Q1"),
    );
    expect(result?.rows[0]?.time).toBe("1:28.852");
    expect(result?.rows[1]?.time).toBe("+0.109");
    expect(result?.rows[2]?.name).toBe("Di Giannantonio");
    expect(result?.rows[3]?.name).toBe("M. Marquez");
    expect(result?.rows[7]?.name).toBe("A. Marquez");
    expect(result?.rows).toHaveLength(22);
    expect(result?.rows[11]?.pos).toBe("12");
    expect(result?.rows[12]).toEqual({
      pos: "13",
      id: "56475aa3-f3d1-485a-b6db-ca1149e1b6fa",
      name: "Rins",
      team: "Yamaha",
      time: "Q1 1:29.834",
    });
    expect(result?.rows[21]).toMatchObject({ pos: "22", name: "Espargaro" });
  });

  test("lapped and retired riders", () => {
    const result = parseMotogp("race", {
      classification: [
        row(1, "Pedro Acosta", { first: "0.000", lap: "0" }),
        row(2, "Brad Binder", { first: "0.000", lap: "1" }),
        row(null, "Enea Bastianini", { first: "0.000", lap: "20" }),
      ],
    });
    expect(result?.rows.map((r) => [r.pos, r.time])).toEqual([
      ["1", "40:00.000"],
      ["2", "+1 lap"],
      ["–", "DNF"],
    ]);
  });

  test("empty classification is null", () => {
    expect(parseMotogp("race", { classification: [] })).toBeNull();
    expect(parseMotogp("race", { error_type: "x" })).toBeNull();
  });
});
